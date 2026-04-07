import * as d3 from 'd3'
// import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 36, right: 24, bottom: 48, left: 72};
    size;
    height;
    width;
    svg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    selectedCircleRadius = 7;
    xScale;
    yScale;
    brushG;


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderScatterplot()
        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","svgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        ;

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.svg.append("g")
            .attr("class","yAxisG")
        ;
        this.brushG = this.svg.append("g")
            .attr("class","brushG")
        ;
        this.svg.append("text")
            .attr("class","scatterplotTitle")
            .attr("x",0)
            .attr("y",-14)
        ;
    }

    changeBorderAndOpacity(selection, selected){
        selection.style("opacity", selected?1:this.defaultOpacity)
        ;

        selection.select(".markerCircle")
            .attr("stroke-width",selected?2:0)
        ;
    }

    updateMarkers(selection,xAttribute,yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                return "translate(" + this.xScale(item[xAttribute]) + "," + this.yScale(item[yAttribute]) + ")"
            })
        ;
        this.changeBorderAndOpacity(selection, false)
    }

    highlightSelectedItems(selectedItems, hoveredItemIndex){
        const selectedItemSet = new Set(selectedItems ?? []);
        const hasSelection = selectedItemSet.size > 0;

        this.svg.selectAll(".markerG")
            .style("opacity",(itemData)=>{
                return !hasSelection || selectedItemSet.has(itemData.index) || itemData.index === hoveredItemIndex
                    ? 1
                    : 0.08;
            })
        ;

        this.svg.selectAll(".markerCircle")
            .attr("r",(itemData)=>{
                return selectedItemSet.has(itemData.index) || itemData.index === hoveredItemIndex
                    ? this.selectedCircleRadius
                    : this.circleRadius;
            })
            .attr("fill",(itemData)=>{
                if(itemData.index === hoveredItemIndex){
                    return "#ff8c00";
                }
                return selectedItemSet.has(itemData.index) ? "#08306b" : "black";
            })
            .attr("stroke-width",(itemData)=>{
                return selectedItemSet.has(itemData.index) || itemData.index === hoveredItemIndex ? 3 : 0;
            })
            .attr("stroke",(itemData)=>{
                return itemData.index === hoveredItemIndex ? "#ff8c00" : "#ffffff";
            })
        ;
    }

    updateAxis = function(visData,xAttribute,yAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const xExtent = d3.extent(visData, item=>item[xAttribute]);
        const yExtent = d3.extent(visData, item=>item[yAttribute]);
        this.xScale.domain(xExtent).nice();
        this.yScale.domain(yExtent).nice();

        // create axis with computed scales
        this.svg.select(".xAxisG")
            .transition().duration(this.transitionDuration)
            .call(d3.axisBottom(this.xScale))
        ;
        this.svg.select(".yAxisG")
            .transition().duration(this.transitionDuration)
            .call(d3.axisLeft(this.yScale))
        ;

        this.svg.selectAll(".xAxisLabel")
            .data([xAttribute])
            .join("text")
            .attr("class","xAxisLabel")
            .attr("x",this.width / 2)
            .attr("y",this.height + 40)
            .attr("text-anchor","middle")
            .attr("fill","black")
            .text(item=>item)
        ;
        this.svg.selectAll(".yAxisLabel")
            .data([yAttribute])
            .join("text")
            .attr("class","yAxisLabel")
            .attr("transform","rotate(-90)")
            .attr("x",-this.height / 2)
            .attr("y",-60)
            .attr("text-anchor","middle")
            .attr("fill","black")
            .text(item=>item)
        ;

        this.svg.select(".scatterplotTitle")
            .text("Scatterplot: " + xAttribute + " vs " + yAttribute)
        ;
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        console.log("render scatterplot with a new data list ...")
        const numericVisData = visData.filter(item=>{
            return Number.isFinite(item[xAttribute]) && Number.isFinite(item[yAttribute]);
        });
        if(numericVisData.length === 0){
            this.svg.selectAll(".markerG").remove();
            return;
        }

        // build the size scales and x,y axis
        this.updateAxis(numericVisData,xAttribute,yAttribute);

        this.svg.selectAll(".markerG")
            // all elements with the class .cellG (empty the first time)
            .data(numericVisData,(itemData)=>itemData.index)
            .join(
                enter=>{
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","markerG")
                        .style("opacity",this.defaultOpacity)
                        .on("click", (event,itemData)=>{
                            controllerMethods.handleOnClick(itemData);
                        })
                        .on("mouseenter", (event,itemData)=>{
                            controllerMethods.handleOnMouseEnter(itemData);
                        })
                        .on("mouseleave", ()=>{
                            controllerMethods.handleOnMouseLeave();
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r",this.circleRadius)
                        .attr("stroke","#08306b")
                    ;
                    itemG.append("title")
                        .text(itemData=>{
                            return itemData.communityname + " (state " + itemData.state + ")"
                                + "\nPopulation: " + itemData.population
                                + "\nViolent crime: " + itemData.ViolentCrimesPerPop;
                        })
                    ;
                    this.updateMarkers(itemG,xAttribute,yAttribute);
                },
                update=>{
                    this.updateMarkers(update,xAttribute,yAttribute)
                },
                exit =>{
                    exit.remove()
                    ;
                }

            )
        ;

        this.updateBrush(numericVisData, xAttribute, yAttribute, controllerMethods);
    }

    updateBrush = function(visData, xAttribute, yAttribute, controllerMethods){
        const brush = d3.brush()
            .extent([[0,0],[this.width,this.height]])
            .on("end", (event)=>{
                if(!event.selection){
                    controllerMethods.handleOnBrush([]);
                    return;
                }

                const [[x0,y0],[x1,y1]] = event.selection;
                const selectedItems = visData.filter(itemData=>{
                    const x = this.xScale(itemData[xAttribute]);
                    const y = this.yScale(itemData[yAttribute]);
                    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                });
                controllerMethods.handleOnBrush(selectedItems);
            })
        ;

        this.brushG.call(brush);
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;
