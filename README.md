Basically, have your project's package.json be like:

``` js
{  
  "devDependencies": {  
    "mocha-teamcity-tests-cov-reporter": ">=1.0.0"  
  }  
}
```

Then call mocha with:

`mocha -R mocha-teamcity-tests-cov-reporter test`