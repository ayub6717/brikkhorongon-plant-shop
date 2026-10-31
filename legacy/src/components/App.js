import React, { useReducer } from "react";
import "./App.css";
import MainComponent from "./MainComponent/MainComponent";
import FooterComponent from "./FooterComponent/FooterComponent";
import { initialState } from "../data/items";

let activeCategory = "All";

const filterPrice = {
	All: [200, 300, 400, 600, 800, 1520, 1650, 1400, 1500, 1800, 2000, 2200, 2500, 3000],
	Indor: [200, 300, 400, 800, 2200],
	Calathea: [1400, 1500, 1800, 2000],
	Dracaena: [1520, 1650, 1800, 3000],
	Ficus: [800, 1500, 1800, 2500],
	Orchids: [400, 600, 800, 1500, 1800],
};

const reducer = (state, action) => {
	let AllItems = initialState;
	switch (action.type) {
		case "All": {
			activeCategory = "All";
			return initialState;
		}
		case "Indor": {
			AllItems = initialState;
			activeCategory = "Indor";
			return AllItems.filter((myState) => myState.type === "Indor");
		}
		case "Calathea": {
			AllItems = initialState;
			activeCategory = "Calathea";
			return AllItems.filter((myState) => myState.type === "Calathea");
		}
		case "Dracaena": {
			AllItems = initialState;
			activeCategory = "Dracaena";
			return AllItems.filter((myState) => myState.type === "Dracaena");
		}
		case "Ficus": {
			AllItems = initialState;
			activeCategory = "Ficus";
			return AllItems.filter((myState) => myState.type === "Ficus");
		}
		case "Orchids": {
			AllItems = initialState;
			activeCategory = "Orchids";
			return AllItems.filter((myState) => myState.type === "Orchids");
		}
		case "AddItem": {
			AllItems = initialState;
			activeCategory = action.item.type;
			AllItems.push(action.item);
			return AllItems.filter((myState) => myState.type === activeCategory);
		}
		case "SearchItem": {
			AllItems = initialState;
			return AllItems.filter((myState) =>
				myState.itemName.includes(action.searchKey)
			);
		}
		case "filterPrice": {
			AllItems = initialState;
			return (AllItems.filter((myState) => {
				if (activeCategory === "All") {
					return myState.price <= action.itemPrice;
				}
				return (
					myState.type === activeCategory && myState.price <= action.itemPrice
				);
			}));
		}
		case "deleteItem": {
			AllItems = initialState;
			activeCategory = action.currentItem;
			return AllItems.filter((myState) => {
				return myState.Id !== action.itemId && myState.type === activeCategory;
			});
		}
		case "editItem": {
			AllItems = initialState;
			activeCategory = action.item.type;
			return AllItems.filter((myState) => {
				if(myState.Id === action.item.Id) {
					myState.itemName = action.item.itemName;
					myState.type = action.item.type;
					myState.price = action.item.price;
					myState.itemImage = action.item.itemImage;
					myState.description = action.item.description;
				}
				return myState.type === activeCategory;
			});
		}
		default: {
			activeCategory = "All";
			return initialState;
		}
	}
};

const ItemContext = React.createContext();

function App() {
	const [items, dispatch] = useReducer(reducer, initialState);
	return (
		<div className="App container">
			<section className="row">
				<div className="col-sm-12">
					<ItemContext.Provider
						value={{
							items: items,
							itemDispatch: dispatch,
							activeCategory: activeCategory,
							itemCurrentPage: 1,
							filterPrice: filterPrice[activeCategory],
						}}
					>
						<MainComponent />
					</ItemContext.Provider>
					
				</div>
			</section> <br/>
			
			<section className="row">
				<div className="col-sm-12">
					<FooterComponent />
				</div>
			</section>

		</div>
	);
}

export { ItemContext };
export default App;
