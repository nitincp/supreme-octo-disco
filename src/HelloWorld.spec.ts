import { HelloWorld } from './HelloWorld'

describe('Hello World', () => {
  it('Should create object', () => {
    const hw = new HelloWorld()
    console.log(hw.hello())
  })
})
