import './Hierarchy.css'
import { useEffect, useRef } from 'react';
import {useSelector, useDispatch} from 'react-redux'

import HierarchyD3 from './Hierarchy-d3';
import { setHoveredItemIndex, setSelectedItemIndexes } from '../../redux/ItemInteractionSlice';

function HierarchyContainer({layoutType, valueAttributeName}){
    const visData = useSelector(state =>state.dataSet)
    const selectedItemIndexes = useSelector(state =>state.itemInteraction.selectedItemIndexes)
    const hoveredItemIndex = useSelector(state =>state.itemInteraction.hoveredItemIndex)
    const dispatch = useDispatch();

    const divContainerRef=useRef(null);
    const hierarchyD3Ref = useRef(null)

    const getChartSize = function(){
        let width = 500;
        let height = 600;
        if(divContainerRef.current){
            width=divContainerRef.current.offsetWidth;
            height=divContainerRef.current.offsetHeight;
        }
        return {width:width,height:height};
    }

    useEffect(()=>{
        const hierarchyD3 = new HierarchyD3(divContainerRef.current);
        hierarchyD3.create({size:getChartSize()});
        hierarchyD3Ref.current = hierarchyD3;
        return ()=>{
            hierarchyD3.clear()
        }
    },[]);

    useEffect(()=>{
        const hierarchyD3 = hierarchyD3Ref.current;
        if(!hierarchyD3){
            return;
        }

        const controllerMethods={
            handleOnClick: (itemsData)=>{
                dispatch(setSelectedItemIndexes(itemsData.map(itemData=>itemData.index)));
            },
            handleOnMouseEnter: (itemData)=>{
                dispatch(setHoveredItemIndex(itemData ? itemData.index : null));
            },
            handleOnMouseLeave: ()=>{
                dispatch(setHoveredItemIndex(null));
            }
        }

        hierarchyD3.renderHierarchy(
            visData,
            layoutType,
            valueAttributeName,
            controllerMethods
        );
    },[visData, dispatch, layoutType, valueAttributeName]);

    useEffect(()=>{
        const hierarchyD3 = hierarchyD3Ref.current;
        if(hierarchyD3){
            hierarchyD3.highlightSelectedItems(selectedItemIndexes, hoveredItemIndex);
        }
    },[selectedItemIndexes, hoveredItemIndex]);

    return(
        <div ref={divContainerRef} className="hierarchyDivContainer col">

        </div>
    )
}

export default HierarchyContainer;
