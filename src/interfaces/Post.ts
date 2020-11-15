export default interface IPost{
  _id: string,
  task: {text:string, isUrl: boolean}
  taskSolution: string,
  location: {
      type: string,
      coordinates : Array<number>
  }
}