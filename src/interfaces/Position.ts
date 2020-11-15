
export default interface IPosition {
  lastUpdated:Date,
  userName:string,
  name:string,
  location: {
      type: string,  //No (easy) way in typescript to restrict this to the only legal value "point"
      coordinates : Array<number>
  }
}