import React from "react";
import "./FooterComponent.css";

function FooterComponent() {
	return (
		<div className="footer row">
			<div className="col-md-4">
				<h5>Contacts</h5>
				<p>Md.Ayub</p>
				<p>ahmed1.ayub6717@gmail.com</p>
				<p>01405174545</p>
			</div>
			<div className="col-md-4">
				<h5>Social Links</h5>
				<p>github.com/ayub6717</p>
				<p>linkedin.com/in/ayub6717</p>
				<p>facebook.com/ayub6717</p>
				<p>twitter.com/ayub6717</p>
			</div>
			<div className="col-md-4">
				<h5>Company</h5>
				<p>Advertise</p>
				<p>Privacy Policy</p>
				<p>Terms of use</p>
			</div>
			<p className="copyright">
				All rights reserved ©Brikkhorongon 
			</p>
		</div>
	);
}

export default FooterComponent;
