export class HelloWorld {
  // eslint-disable-next-line no-useless-constructor
  constructor (private name: string = 'World') { }

  hello () {
    console.log(`Hello ${this.name}`)
  }
}
