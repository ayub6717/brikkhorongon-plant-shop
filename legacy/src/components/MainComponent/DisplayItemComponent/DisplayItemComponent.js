import React, { useContext, useState, useEffect } from "react";
import ItemComponent from "./ItemComponent/ItemComponent";
import { ItemContext } from "../../App";
import Pagination from "./Pagination";

function DisplayItemComponent() {
	const itemsContext = useContext(ItemContext);
	const [currentPage, setCurrentPage] = useState(itemsContext.itemCurrentPage);
	const itemPerPage = 12;

	// get Current items
	const indexOfLastItem = currentPage * itemPerPage;
	const indexOfFirstItem = indexOfLastItem - itemPerPage;
	const currentItems = itemsContext.items.slice(
		indexOfFirstItem,
		indexOfLastItem
	);

	const paginate = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [itemsContext.items]);

	return (


		<div>
					<div className="row">
			{currentItems.map((item) => (
			<div className=" col-sm-3">
				
					<React.Fragment key={item.Id}>
						<ItemComponent item={item} />
					</React.Fragment>
			
			</div>
				))}

		</div>
		<div> <br/> 
				<Pagination 
					itemPerPage={itemPerPage}
					totalItems={itemsContext.items.length}
					currentPage={currentPage}
					paginate={paginate}
				/>
			</div>
		</div>
	);
}

export default DisplayItemComponent;
