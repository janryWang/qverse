import test from "ava"
import qverse from "../src/index"

const testAll = obj => {
    for (let name in obj) {
        test(name, t => {
            const match = qverse(obj[name].traverse)
            t.deepEqual(
                obj[name].after,
                match(obj[name].before, { path: name.split("."), key: name })
            )
        })
    }
}

testAll({
    "aaa.bbb.ccc":{
        before:{
            props:{
                a:1,
                b:2,
                c:3
            }
        },
        after:{
            props:{
                a:11,
                b:22,
                c:33
            }
        },
        traverse($){
            $("*").produce((payload)=>{
                payload.props.a = 11
            })
            $("aaa.*").produce((payload)=>{
                payload.props.b = 22
            })
            $("aaa.bbb.*").produce((payload)=>{
                payload.props.c = 55
            })
            $("aaa.bbb.ccc").produce((payload)=>{
                payload.props.c -= 22
            })

            console.log($.replace("111.222.333",{
                $2:"dddd"
            }))
        }
    },
    "aaa.0.cccc":{
        before:{
            props:{
                a:1,
                b:2,
                c:3
            }
        },
        after:{
            props:{
                a:11,
                b:22,
                c:33
            }
        },
        traverse($){
            $("*").produce((payload)=>{
                payload.props.a = 11
            })
            $("aaa.*").produce((payload)=>{
                payload.props.b = 22
            })
            $("aaa.*[:3].*").produce((payload)=>{
                payload.props.c = 33
            })
        }
    },
    "aaa.bbb.ccc1":{
        before:{
            props:{
                a:1,
                b:2,
                c:3
            }
        },
        after:{
            props:{
                a:1,
                b:2,
                c:33
            }
        },
        traverse($){

            $("*").produce((payload)=>{
                payload.props.a = 11
            })
            $("aaa.*").produce((payload)=>{
                payload.props.b = 22
            })

            $("*")
            .display(false)
            .select("aaa.bbb.ccc1")
            .rescue()
            .select("aaa.bbb.*")
            .produce((payload)=>{
                payload.props.c = 55
            })
            .select("aaa.bbb.ccc1")
            .produce((payload)=>{
                payload.props.c -= 22
            })
        }
    },
    "aaa.bbb.kkk":{
        before:{
        },
        after:{
            props:{
                a:1,
                b:2,
                c:33
            }
        },
        traverse($){
            $("*").produce((payload)=>{
                payload.props = {}
                payload.props.a = 1
            })

            $("*").produce((payload)=>{
                payload.props.b = 2
            })

            $("aaa.bbb.*").produce((payload)=>{
                payload.props.c = 33
            })
        }
    },
    "aaa.bbb.ddd":{
        before:{
        },
        after:{
            props:{
                a:1,
                b:2,
                c:33
            }
        },
        traverse($){
            $("*",{
                include:["aaa.bbb.ddd"]
            }).produce((payload)=>{
                payload.props = {}
                payload.props.a = 1
            })

            $("*",{
                include:["aaa.bbb.ddd"]
            }).produce((payload)=>{
                payload.props.b = 2
            })

            $("*",{
                exclude:["aaa.bbb.ddd"]
            }).display(false)

            $("aaa.bbb.*",{
                include:["aaa.bbb.ddd"]
            }).produce((payload)=>{
                payload.props.c = 33
            })
        }
    },
})