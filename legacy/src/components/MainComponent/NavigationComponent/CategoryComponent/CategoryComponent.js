import React, { useContext } from "react";
import "./CategoryComponent.css";
import { ItemContext } from "../../../App";
import { Navbar, Nav, Form } from 'react-bootstrap'
import AddItemComponent from "../../../HeaderComponent/AddItemComponent";
import style from '../../../../components/style.module.css'
import SearchComponent from "../../../HeaderComponent/SearchComponent";
import FilterComponent from "../FilterComponent/FilterComponent";
import ControlledCarousel from "../../DisplayItemComponent/ItemComponent/ControlledCarousel";
// import Scrollspy from 'react-scrollspy'


const category = [
	{
		itemName: "All",
		iconName: "fas fa-home",
	},
	{
		itemName: "Indor",
		iconName: "fas fa-tree",
	},
	{
		itemName: "Calathea",
		iconName: "fas fa-tree",
	},
	{
		itemName: "Dracaena",
		iconName: "fas fa-tree",
	},
	{
		itemName: "Ficus",
		iconName: "fas fa-tree",
	},
	{
		itemName: "Orchids",
		iconName: "fas fa-tree",
	},
];

function CategoryComponent() {
	const itemsContext = useContext(ItemContext);
	return (

		<div>
			<Navbar collapseOnSelect expand="lg" style={{backgroundColor:"#0c5c2bc2"}} >
				
                <Navbar.Brand href="#home">
                    <img className={style.img_1}  src={require(`./../CategoryComponent/brikkho.png`)} alt="brikkho" />
                </Navbar.Brand>
					<div style={{padding:'20px'}}>
					<	AddItemComponent />
					</div>
					<Form Form inline >
						<SearchComponent  />
                    </Form> 
				
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
				
                <Navbar.Collapse  id="responsive-navbar-nav">
				{category.map((item) => (
                    <Nav style={{marginLeft:"10px"}}  >
						{/* <Scrollspy items={ ['section-1', 'section-2', 'section-3'] } currentClassName="is-current"> */}
                        <Nav.Link href="#section-1"  style={{ color:'white'}}
							key={item.itemName} 
							onClick={() => itemsContext.itemDispatch({ type: item.itemName }) } 

							>
								<i className={item.iconName}></i> {item.itemName}
						</Nav.Link>
						{/* </Scrollspy> */}
                    </Nav>
					))}
																
					{/* <NavDropdown className="mr-auto"  title="Another Tree" id="collasible-nav-dropdown" >
						{category.map((item) => (		
							<NavDropdown.Item href="#action/3.1" 
								key={item.itemName} 
								onClick={() => itemsContext.itemDispatch({ type: item.itemName })} 
						>
								<i className={item.iconName}></i> {item.itemName}
							</NavDropdown.Item>
						))}
					</NavDropdown> */}
					
                </Navbar.Collapse>
            </Navbar> <br/>
			<ControlledCarousel />
			<FilterComponent />

		</div>
	);
}

export default CategoryComponent;
