import React from "react";
import SearchComponent from "./SearchComponent";
import AddItemComponent from "./AddItemComponent";
import "./HeaderComponent.css";

function HeaderComponent() {
	return (
		<div className="myHeader row">
			<div className="col-md-3">
				<h6>The Hooks Planet</h6>
			</div>
			<div className="col-md-6">
				<SearchComponent />
			</div>
			<div className="col-md-3">
				<AddItemComponent />
			</div>
		</div>
	);
}

export default HeaderComponent;
