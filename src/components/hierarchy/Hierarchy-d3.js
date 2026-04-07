import * as d3 from 'd3'

class HierarchyD3 {
    margin = {top: 36, right: 8, bottom: 8, left: 8};
    size;
    height;
    width;
    svg;
    defaultOpacity=0.45;
    transitionDuration=600;
    layoutType;
    colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0,1]);

    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","hierarchySvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }

    buildHierarchyData = function(visData, valueAttributeName){
        const validItems = visData.filter(item=>{
            return item.state !== "?" && item.communityname !== "?" && item.communityname !== undefined;
        });
        const stateGroups = d3.group(validItems, item=>String(item.state));

        return {
            name: "US",
            children: Array.from(stateGroups, ([state, items])=>{
                return {
                    name: "State " + state,
                    children: items.map(item=>{
                        const value = Number.isFinite(item[valueAttributeName]) ? item[valueAttributeName] : 0.0001;
                        return {
                            name: item.communityname,
                            value: Math.max(value, 0.0001),
                            crimeValue: Number.isFinite(item.ViolentCrimesPerPop) ? item.ViolentCrimesPerPop : 0,
                            item: item,
                            index: item.index
                        };
                    })
                };
            })
        };
    }

    getNodeItems = function(nodeData){
        return nodeData.leaves().map(leaf=>leaf.data.item).filter(Boolean);
    }

    renderHierarchy = function(visData, layoutType, valueAttributeName, controllerMethods){
        const layoutChanged = this.layoutType !== layoutType;
        this.layoutType = layoutType;
        if(layoutChanged){
            this.svg.selectAll(".hierarchyNodeG").interrupt().remove();
        }

        const hierarchyData = this.buildHierarchyData(visData, valueAttributeName);
        const root = d3.hierarchy(hierarchyData)
            .sum(item=>item.value ?? 0)
            .sort((a,b)=>b.value-a.value);

        if(root.children === undefined){
            this.svg.selectAll(".hierarchyNodeG").remove();
            return;
        }

        if(layoutType === "pack"){
            d3.pack()
                .size([this.width, this.height])
                .padding(3)
                (root);
        }else{
            d3.treemap()
                .size([this.width, this.height])
                .paddingOuter(3)
                .paddingInner(1)
                (root);
        }

        this.svg.selectAll(".hierarchyTitle")
            .data([(layoutType === "pack" ? "Circle pack" : "Treemap") + ": size by " + valueAttributeName])
            .join("text")
            .attr("class","hierarchyTitle")
            .attr("x",0)
            .attr("y",-12)
            .text(item=>item)
        ;

        const nodes = root.descendants().filter(node=>node.depth > 0);
        const nodeG = this.svg.selectAll(".hierarchyNodeG")
            .data(nodes, node=>layoutType + "/" + node.ancestors().map(ancestor=>ancestor.data.name).join("/"))
            .join(
                enter=>{
                    const g = enter.append("g")
                        .attr("class","hierarchyNodeG")
                        .style("opacity", this.defaultOpacity)
                        .on("click", (event,nodeData)=>{
                            controllerMethods.handleOnClick(this.getNodeItems(nodeData));
                        })
                        .on("mouseenter", (event,nodeData)=>{
                            controllerMethods.handleOnMouseEnter(nodeData.data.item);
                        })
                        .on("mouseleave", ()=>{
                            controllerMethods.handleOnMouseLeave();
                        })
                    ;
                    g.append(layoutType === "pack" ? "circle" : "rect")
                        .attr("class","hierarchyShape")
                    ;
                    g.append("text")
                        .attr("class","hierarchyLabel")
                    ;
                    return g;
                },
                update=>update,
                exit=>exit.remove()
            )
        ;

        const hierarchyShape = nodeG.select(".hierarchyShape")
            .interrupt()
            .attr("fill", node=>{
                if(node.depth === 1){
                    return "#deebf7";
                }
                return this.colorScale(node.data.crimeValue ?? 0);
            })
            .attr("stroke", "#fff")
            .attr("fill-opacity", node=>node.depth === 1 ? 0.45 : 0.85)
        ;

        if(layoutType === "pack"){
            hierarchyShape
                .attr("cx", node=>node.x)
                .attr("cy", node=>node.y)
                .attr("r", node=>node.r)
            ;
        }else{
            hierarchyShape
                .attr("x", node=>node.x0)
                .attr("y", node=>node.y0)
                .attr("width", node=>Math.max(0,node.x1-node.x0))
                .attr("height", node=>Math.max(0,node.y1-node.y0))
            ;
        }

        nodeG.select(".hierarchyLabel")
            .attr("x", node=>layoutType === "pack" ? node.x : node.x0 + 3)
            .attr("y", node=>layoutType === "pack" ? node.y : node.y0 + 12)
            .attr("text-anchor", node=>layoutType === "pack" ? "middle" : "start")
            .text(node=>{
                if(node.depth === 1){
                    const stateSize = layoutType === "pack" ? node.r * 2 : node.x1 - node.x0;
                    return stateSize > 35 ? node.data.name : "";
                }
                const width = layoutType === "pack" ? node.r * 2 : node.x1 - node.x0;
                const height = layoutType === "pack" ? node.r * 2 : node.y1 - node.y0;
                return layoutType === "pack" ? "" : (width > 140 && height > 28 ? node.data.name : "");
            })
        ;

        nodeG.selectAll("title")
            .data(node=>[node])
            .join("title")
            .text(node=>{
                if(node.depth === 1){
                    return node.data.name + "\nCommunities: " + node.leaves().length;
                }
                return node.data.name + " (state " + node.data.item.state + ")"
                    + "\nPopulation: " + node.data.item.population
                    + "\nViolent crime: " + node.data.item.ViolentCrimesPerPop;
            })
        ;
    }

    highlightSelectedItems = function(selectedItems, hoveredItemIndex){
        const selectedItemSet = new Set(selectedItems ?? []);
        const hasSelection = selectedItemSet.size > 0;

        this.svg.selectAll(".hierarchyNodeG")
            .style("opacity",(nodeData)=>{
                const nodeIndexes = nodeData.leaves().map(leaf=>leaf.data.index);
                const isSelected = nodeIndexes.some(index=>selectedItemSet.has(index));
                const isHovered = nodeIndexes.includes(hoveredItemIndex);
                return !hasSelection || isSelected || isHovered ? 1 : this.defaultOpacity;
            })
        ;

        this.svg.selectAll(".hierarchyShape")
            .attr("stroke",(nodeData)=>{
                const nodeIndexes = nodeData.leaves().map(leaf=>leaf.data.index);
                return nodeIndexes.includes(hoveredItemIndex) ? "#ff8c00" : "#08306b";
            })
            .attr("stroke-width",(nodeData)=>{
                const nodeIndexes = nodeData.leaves().map(leaf=>leaf.data.index);
                return nodeIndexes.some(index=>selectedItemSet.has(index)) || nodeIndexes.includes(hoveredItemIndex) ? 2 : 0.5;
            })
        ;
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default HierarchyD3;
