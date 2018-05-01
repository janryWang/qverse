# qverse

> Traverse any data with [DPML](https://github.com/janryWang/dot-match) commands.
>
> You can use qverse for [react-propers](https://github.com/janryWang/react-propers).



### Usage

```
import React from "react"
import ReactDOM from "react-dom"
import Propers from "react-propers"
import qverse from "qverse"

ReactDOM.render(
   <Propers selector="$id" traverse={qverse(($)=>{
       $("*(aaa,bbb)").produce((props)=>{
           props.className = "yellow"
       })
       
       $("ddd").display(false)
       
       $(["aaa","bbb"]).produce(props=>{
           props.className += " blue-font"
       })
   })}>
      {React=>(
       <>
         <div $id="aaa">111</div>
         <div $id="bbb">222</div>
         <div $id="ccc">333</div>
         <div $id="ddd">444</div>
       </>
      )}
   </Propers>
)

//out put

<div class="yellow blue-font">111</div><div class="yellow blue-font">222</div><div>333</div>
```



### Install

```
npm install --save qverse
```



### API



**`qverse(ctrl : Controller ) : Traverse`**

> create traverse with callback function



**`extend(proto : Object)`**

> extend some methods for CommandFactory 





### Interface



**Controller**

```
interface Controller {
  ($ : CommandFactory) : Traverse
}
```



**CommandFactory**

```
interface Replacer {
    $0:function(item : String) : String
    $1:function(item : String) : String
    $2:function(item : String) : String
    ....
}

interface CommandFactory {
   (DPML : String | Array<String> | Function , Options : MatchOptions) : Command
   replace(path : String,replacer : Replacer ) : String
   path() : Array<String>
   key() : String
   params() : any
   payload() : any
}
```



**Command**

```
interface Command {
    filter(params : CurrentParams) : Boolean
    exclude(params : CurrentParams) : Boolean
    include(params : CurrentParams) : Boolean
    state(path : String) : any // State getter for CurrentParams
    produce(callback : function(payload : any): Boolean? ) : any //Here is the usage of https://github.com/mweststrate/immer
    rescue() : Void //Because our command is an orderly execution logic, if the previous command overrides the result of the following command, then we can use the rescue method.
}
```



**MatchOptions**

```

interface MachOptions {
    include?:function(params : CurrentParams) : Boolean;
    exclude?:function(params : CurrentParams) : Boolean
}
```



**Traverse**

```
interface Traverse{
   (payload : any,params : CurrentParams) : any
}
```



**CurrentParams**

```
interface CurrentParams {
    key:String,
    path:Array<String>
}
```



### LICENSE

The MIT License (MIT)

Copyright (c) 2018 JanryWang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

