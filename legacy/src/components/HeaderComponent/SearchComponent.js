import React, { useContext } from "react";
import "./HeaderComponent.css";
import { ItemContext } from "../App";

function SearchComponent() {
	const itemsContext = useContext(ItemContext);
	return (
		<div>
			<input
				onChange={(e) => {
					itemsContext.itemDispatch({
						type: "SearchItem",
						searchKey: e.target.value,
					});
				}}
				type="text"
				className="form-control"
				placeholder="Search here.."
			/>
		</div>
	);
}

export default SearchComponent;
