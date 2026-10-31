// import React, { useState } from "react";
// import {ImageResponsive} from 'react-image-responsive';
import React from 'react'
import { Carousel } from 'react-bootstrap'
import style from '../../../style.module.css'


function ControlledCarousel() {

  return (
    <Carousel >
      <Carousel.Item interval={5000}>
        <img className={style.img_2}
          src={require(`../../../../data/img/brikkho-2.jpg`)}
          alt="First slide"
        />
      </Carousel.Item>
      <Carousel.Item interval={3000}>
        <img className={style.img_2}
          
          src={require(`../../../../data/img/brikkho-3.jpg`)}
          alt="Third slide"
        />
      </Carousel.Item>
      <Carousel.Item interval={900}>
        <img className={style.img_2}
            
            src={require(`../../../../data/img/brikkho-1.jpg`)}
            alt="Third slide"
          />
        {/* <ImageResponsive
          path={"/img/brikkho-1.jpg"}
        alt="this is my image"
        width="100px"
        height="100px"

        /> */}
      </Carousel.Item>
    </Carousel>
  );
}
export default ControlledCarousel
