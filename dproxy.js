let activeEffect;

class Dep{
  constructor(){
    this.subs = new Set();
  }

  depend(){
    // 收集依赖
    if(activeEffect){
      this.subs.add(activeEffect);
    }
  }
  notify(){
    // 数据变化，通知effect执行。
    this.subs.forEach(effect=>effect())
  }
}


const ref = (initVal)=>{
  const dep = new Dep();

  let state = {
    get value(){
      // 收集依赖
      dep.depend();
      return initVal;
    },

    set value(newVal){
      // 修改，通知dep执行有此依赖的effect
      dep.notify();
      return newVal;
    }
  }

  return state;
}

let state = ref(0);



const effect = (fn)=>{
  activeEffect = fn;
  fn();
}

effect(()=>{
  console.log(`state被变更为`,state.value)
});

state.value = 1;