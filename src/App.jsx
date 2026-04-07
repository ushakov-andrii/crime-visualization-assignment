import './App.css';
import { useEffect, useState} from 'react';
import { useDispatch } from 'react-redux';
import ScatterplotContainer from './components/scatterplot/ScatterplotContainer';
import HierarchyContainer from './components/hierarchy/HierarchyContainer';
import { getDataSet } from './redux/DataSetSlice';

// here import other dependencies

// a component is a piece of code which render a part of the user interface
function App() {
  const dispatch = useDispatch();
  const [hierarchyLayout, setHierarchyLayout] = useState("treemap");

  // every time the component re-render
  useEffect(()=>{
      console.log("App useEffect (called each time App re-renders)");
  }); // if no second parameter, useEffect is called at each re-render

  useEffect(()=>{
      dispatch(getDataSet());
  }, [dispatch]);

  return (
    <div className="App">
        <div className="appHeader">
          <h1>Communities and Crime Explorer</h1>
          <p>Brush the scatterplot or hover/click hierarchy nodes to compare communities by state.</p>
        </div>
        <div id={"MultiviewContainer"}>
          <section className="chartSection scatterplotSection">
            <ScatterplotContainer
              xAttributeName={"population"}
              yAttributeName={"ViolentCrimesPerPop"}
            />
          </section>
          <section className="chartSection hierarchySection">
            <div className="hierarchyToolbar">
              <div>
                <h2>{hierarchyLayout === "treemap" ? "Treemap" : "Circle pack"}: state to community</h2>
                <p>Size = population, blue intensity = violent crime rate. Hover a block/circle for city details.</p>
              </div>
              <div className="layoutButtons">
                <button
                  className={hierarchyLayout === "treemap" ? "active" : ""}
                  onClick={()=>setHierarchyLayout("treemap")}
                >
                  Treemap
                </button>
                <button
                  className={hierarchyLayout === "pack" ? "active" : ""}
                  onClick={()=>setHierarchyLayout("pack")}
                >
                  Circle pack
                </button>
              </div>
            </div>
            <div className="hierarchyGrid">
              <div className="hierarchyPrimary">
                <HierarchyContainer
                  layoutType={hierarchyLayout}
                  valueAttributeName={"population"}
                />
              </div>
            </div>
          </section>
        </div>
    </div>
  );
}

export default App;
