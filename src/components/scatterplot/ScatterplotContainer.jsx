import './Scatterplot.css'
import { useEffect, useRef } from 'react';
import {useSelector, useDispatch} from 'react-redux'

import ScatterplotD3 from './Scatterplot-d3';
import { setHoveredItemIndex, setSelectedItemIndexes } from '../../redux/ItemInteractionSlice';

function ScatterplotContainer({xAttributeName, yAttributeName}){
    const visData = useSelector(state =>state.dataSet)
    const selectedItemIndexes = useSelector(state =>state.itemInteraction.selectedItemIndexes)
    const hoveredItemIndex = useSelector(state =>state.itemInteraction.hoveredItemIndex)
    const dispatch = useDispatch();

    // every time the component re-render
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect (called each time matrix re-renders)");
    }); // if no second parameter, useEffect is called at each re-render

    const divContainerRef=useRef(null);
    const scatterplotD3Ref = useRef(null)

    const getChartSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width = 800;
        let height = 600;
        if(divContainerRef.current){
            width=divContainerRef.current.offsetWidth;
            // width = '100%';
            height=divContainerRef.current.offsetHeight;
            // height = '100%';
        }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect [] called once the component did mount");
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("ScatterplotContainer useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect with dependency [scatterplotData, xAttribute, yAttribute, scatterplotControllerMethods], called each time scatterplotData changes...");

        const handleOnClick = function(itemData){
            dispatch(setSelectedItemIndexes([itemData.index]));
        }
        const handleOnMouseEnter = function(itemData){
            dispatch(setHoveredItemIndex(itemData.index));
        }
        const handleOnMouseLeave = function(){
            dispatch(setHoveredItemIndex(null));
        }
        const handleOnBrush = function(itemsData){
            dispatch(setSelectedItemIndexes(itemsData.map(itemData=>itemData.index)));
        }

        const controllerMethods={
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave,
            handleOnBrush
        }

        // get the current instance of scatterplotD3 from the Ref...
        // call renderScatterplot of ScatterplotD3...;
        const scatterplotD3 = scatterplotD3Ref.current;
        if(scatterplotD3){
            scatterplotD3.renderScatterplot(
                visData,
                xAttributeName,
                yAttributeName,
                controllerMethods
            );
        }
    },[visData,dispatch,xAttributeName,yAttributeName]);// if dependencies, useEffect is called after each data update, in our case only visData changes.

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        if(scatterplotD3){
            scatterplotD3.highlightSelectedItems(selectedItemIndexes, hoveredItemIndex);
        }
    },[selectedItemIndexes, hoveredItemIndex]);

    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col">

        </div>
    )
}

export default ScatterplotContainer;
