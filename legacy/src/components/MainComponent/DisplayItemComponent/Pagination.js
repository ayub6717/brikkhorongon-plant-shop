import React from "react";
import "./DisplayItemComponent.css";



function Pagination({ itemPerPage, totalItems, paginate, currentPage }) {
	const pageNumbers = [];

	for (let i = 1; i <= Math.ceil(totalItems / itemPerPage); i++) {
		pageNumbers.push(i);
	}
	return (
		<nav >
			<ul className='pagination' >
				<span
					style={{ marginRight: "15px", marginTop: "5px", fontWeight: "600" }}
				>
					page :
				</span>
				{pageNumbers.map((number) => (
					<li
						key={number}
						className={"page-item " + (number === currentPage ? "active" : "")}
					>
						<span onClick={() => paginate(number)} className="page-link">
							{number}
						</span>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default Pagination;
