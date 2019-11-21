import Jasmine from "jasmine";
import { DisplayProcessor, SpecReporter } from "jasmine-spec-reporter";
import SuiteInfo = jasmine.SuiteInfo;



const jasmine = new Jasmine({})

jasmine.loadConfigFile('jasmine.json')
jasmine.configureDefaultReporter({
  showColors: false
})

jasmine.onComplete(function (passed) {
  if (passed) {
    console.log('All specs have passed');
  }
  else {
    console.log('At least one spec has failed');
  }
});

class CustomProcessor extends DisplayProcessor {
  public displayJasmineStarted(info: SuiteInfo, log: string): string {
    return `TypeScript ${log}`;
  }
}

const sr = new SpecReporter({
  customProcessors: [CustomProcessor],
});

jasmine.completionReporter = sr;

jasmine.execute()
