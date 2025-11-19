import { Photo } from "./photoModel";
import { Point } from "./pointModel";

export interface ImagePoint {
  imageId: string;
  pointId: string;
  photo?: Photo;
  point?: Point;
}