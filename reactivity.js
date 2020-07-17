let targetMap = new WeakMap();

const effectStack = [];

// 依赖收集
const track = (target,key) => {

  // reactive可能有多个，一个可能又有多个key
  const effect = effectStack[effectStack.length - 1];

  if(effect){

    // 尝试找到属于该数据的依赖对象（depMap）
    let depMap = targetMap.get(target);

    // 如果不存在，则把它定义为一个Map，并添加到targetMap中
    if(!depMap){
      depMap = new Map();
      targetMap.set(target,depMap);
    }

    // 找到这个对象的这个属性，获取对这个对象，这个属性对依赖。
    let dep = depMap.get(key);

    // 如果不存在，则初始化一个set。
    if(!dep){
      dep = new Set();
      depMap.set(key,dep);
    }

    // 核心逻辑：现在拿到dep了，把副作用添加进去。
    dep.add(effect);
    effect.deps.push(dep);
  }
  
}

// 依赖派发
const trigger = (target,key,info) => {
  const depMap =targetMap.get(target);

  // 如果没找到副作用即可结束
  if(!depMap){
    return
  }

  const effects = new Set();
  const computedRunners = new Set();

  if(key){
    let deps = depMap.get(key);

    deps.forEach(effect => {
      // 计算flag为true时，添加到computedRunners
      if(effect.computed){
        computedRunners.add(effect);
      }else{
        effects.add(effect);
      }
    });

    computedRunners.forEach(computed=>computed());
    effects.forEach(effect=>effect());
  }
}

// 计算属性：特殊的effect，多了一个配置
const computed = (fn) => {
  const runner = effect(fn,{computed:true,lazy:true});

  return {
    effect:runner,
    get value(){
      return runner();
    }
  }
}

// 副作用
const effect = (fn,options={}) =>{
  let e = createReactiveEffect(fn,options);
  // 惰性：首次不执行，后续更新才执行
  if(!options.lazy){
    e();
  }
  return e;
}

// 
const createReactiveEffect = (fn,options={})=>{
  const effect = (...args) =>{
    return run(effect,fn,args);
  }
  // 单纯为了后续清理，以及缓存
  effect.deps = [];
  effect.computed = options.computed;
  effect.lazy = options.lazy;
  return effect;
}

// 辅助方法，执行前入栈，最后执行完之后出栈
// 保证最上面一个effect是最新的
const run =(effect,fn,args)=>{
  if(effectStack.indexOf(effect)===-1){
    try {
      effectStack.push(effect);
      return fn(...args);
    } finally {
      effectStack.pop();
    }
  }
}

const createBaseHandler = (taget) => {
  return {
    get(target,key){
      track(target,key);
      return target[key]; // 此处源码用Reflect
    },

    set(target,key,newValue){
      const info = {
        oldValue:target[key],
        newValue
      };

      target[key] = newValue;
      trigger(target,key,info);
    }
  }
}

// 对象响应式
const reactive = (data) => {
  const observer = new Proxy(data,createBaseHandler(data));
  return observer;
}