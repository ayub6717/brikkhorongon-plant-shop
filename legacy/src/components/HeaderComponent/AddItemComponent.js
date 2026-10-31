import React, { useState, useReducer, useContext } from "react";
import "./HeaderComponent.css";
import Modal from "react-modal";
import { ItemContext } from "../App";
Modal.setAppElement("#root");

const customStyles = {
	content: {
		top: "50%",
		left: "50%",
		right: "auto",
		bottom: "auto",
		marginRight: "-50%",
		transform: "translate(-50%, -50%)",
		height: "450px",
		width: "300px",
		backgroundColor: "rgba(59, 146, 126, 0.88)",
	},
};

const initialItem = {
	Id: 0,
	itemName: "",
	type: "",
	price: 0,
	itemImage: "Orchids/no-image-available.jpg",
	description: "",
};

const reducer = (state, action) => {
	switch (action.type) {
		case "Id": {
			return { ...state, Id: action.value };
		}
		case "itemName": {
			return { ...state, itemName: action.value };
		}
		case "type": {
			return { ...state, type: action.value };
		}
		case "price": {
			return { ...state, price: action.value };
		}
		case "itemImage": {
			return { ...state, itemImage: action.value };
		}
		case "description": {
			return { ...state, description: action.value };
		}
		default: {
			return initialItem;
		}
	}
};

// Validation check
const removeErrors = () => {
	const requiredFieldsFields = document.querySelectorAll(".requiredFields");
	requiredFieldsFields.forEach((field) => {
		var elements = field.getElementsByTagName("P");
		while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
	});
}

const checkValidation = (item) => {
	removeErrors();
	if (item.Id && item.itemName && item.type && item.price > 0) {
		return true;
	}
	const requiredFieldsFields = document.querySelectorAll(".requiredFields");
	requiredFieldsFields.forEach((field) => {

		if(field.getElementsByTagName("select").length) {
			var selectedVal = field.getElementsByTagName("select");
			var node, nodeText;
			if(selectedVal[0].options[selectedVal[0].selectedIndex].value === "DEFAULT") {
				node = document.createElement("P");
				nodeText = document.createTextNode("Fill up the required fields!");
				node.appendChild(nodeText);
				field.prepend(node);
			}
		}
		else if (!field.getElementsByTagName("input")[0].value) {
			node = document.createElement("P");
			nodeText = document.createTextNode("Fill up the required fields!");
			node.appendChild(nodeText);
			field.prepend(node);
		}
	});
	return false;
};
//Validation check End

function AddItemComponent() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [item, dispatch] = useReducer(reducer, initialItem);
	const itemsContext = useContext(ItemContext);
	return (
		<div>
			<span onClick={() => setIsModalOpen(true)}>
				<i className="fas fa-plus" style={{color:"white"}}> Add Item </i>
			</span>
			<Modal
				isOpen={isModalOpen}
				onRequestClose={() => setIsModalOpen(false)}
				style={customStyles}
			>
				<h5 className="text-center" >Add an Item</h5>
				<div className="form-group requiredFields">
					<div>
						<label htmlFor="Item No">
							Item No <span className="required">*</span>
						</label>
						<input
							className="form-control"
							type="number"
							placeholder="Item no"
							onChange={(event) =>
								dispatch({ type: "Id", value: event.target.value })
							}
						/>
					</div>
				</div>
				<div className="form-group requiredFields">
					<div>
						<label className="selectLabel">
							Select Type <span className="required">*</span>
						</label>
						<select
							defaultValue={"DEFAULT"}
							className="form-control"
							onChange={(event) =>
								dispatch({ type: "type", value: event.target.value })
							}
						>
							<option value="DEFAULT" disabled>
								Choose Item Type
							</option>
							<option value="Indor">Indor</option>
							<option value="Calathea">Calathea</option>
							<option value="Dracaena">Dracaena</option>
							<option value="Ficus">Ficus</option>
							<option value="Orchids">Orchids</option>
						</select>
					</div>
				</div>
				<div className="form-group requiredFields">
					<div>
						<label htmlFor="Item Name">
							Item Name <span className="required">*</span>
						</label>
						<input
							className="form-control"
							type="text"
							placeholder="Item name"
							onChange={(event) =>
								dispatch({ type: "itemName", value: event.target.value })
							}
						/>
					</div>
				</div>
				<div className="form-group requiredFields">
					<div>
						<label htmlFor="Price">
							Price <span className="required">*</span>
						</label>
						<input
							className="form-control"
							type="number"
							placeholder="Price"
							onChange={(event) =>
								dispatch({ type: "price", value: event.target.value })
							}
						/>
					</div>
				</div>
				<div className="form-group">
					<div>
						<label htmlFor="url">Picture url</label>
						<input
							className="form-control"
							type="text"
							placeholder="Picture url"
							onChange={(event) =>
								dispatch({ type: "itemImage", value: event.target.value })
							}
						/>
					</div>
				</div>
				<div className="form-group">
					<div>
						<label htmlFor="description">Description</label>
						<textarea
							className="form-control"
							type="text"
							placeholder="Description"
							rows="3"
							onChange={(event) =>
								dispatch({ type: "description", value: event.target.value })
							}
						/>
					</div>
				</div>
				<button
					className="btn btn-sm btn-dark closeCls"
					onClick={() => setIsModalOpen(false)}
				>
					Close
				</button>
				<button
					onClick={() => {
						if (checkValidation(item)) {
							itemsContext.itemDispatch({ type: "AddItem", item: item });
							setIsModalOpen(false);
							dispatch({ type: "default" });
						}
					}}
					className="btn btn-sm btn-dark submit"
				>
					Add Item
				</button>
			</Modal>
		</div>
	);
}

export default AddItemComponent;
