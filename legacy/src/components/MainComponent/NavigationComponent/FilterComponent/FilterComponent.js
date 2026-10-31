import React, { useContext } from "react";
import "./FilterComponent.css";
import { ItemContext } from "../../../App";

function FilterComponent() {
	const itemsContext = useContext(ItemContext);
	return (
		<div className="FilterBtn">
			<h6>Filter Item by Price</h6>
			<hr />
			{itemsContext.filterPrice.map((price) => (
				<button onClick={() => {
					itemsContext.itemDispatch({type: "filterPrice", itemPrice : price})
				}} key={price} className="btn btn-sm ">
					৳ {price}
				</button>
			))}
		</div>
	);
}

export default FilterComponent;
