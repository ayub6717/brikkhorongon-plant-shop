import React from 'react'
// import NavigationComponent from './NavigationComponent/NavigationComponent'
import DisplayItemComponent from './DisplayItemComponent/DisplayItemComponent'
import CategoryComponent from './NavigationComponent/CategoryComponent/CategoryComponent';
function MainComponent() {
  return (
    <div>
      <div className='row'>
        <div className='col-sm-12'>
          <CategoryComponent />
        </div>
        <div className='container'>
          <DisplayItemComponent/>
        </div>
      </div>
      
      </div>
  )
}

export default MainComponent
