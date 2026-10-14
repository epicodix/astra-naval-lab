// A prototype air-drop and straight water run. Metres, seconds, no homing.
// The collider is a rounded hull capsule; small fins and fittings are excluded.
export const TORPEDO_SPEC = Object.freeze({noseExtent:2.22,rearExtent:2.68,radius:.224,length:4.9,gravity:9.80665,transitionSeconds:1.3});
const {noseExtent:NOSE,rearExtent:REAR,radius:R,gravity:G,transitionSeconds:TRANSITION}=TORPEDO_SPEC;
const AXIS_LO=-REAR+R,AXIS_HI=NOSE-R,EPS=1e-9;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,n)=>a.map(v=>v*n),subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const length=v=>Math.hypot(...v),unit=(v,fallback=[1,0,0])=>length(v)>EPS?scale(v,1/length(v)):fallback.slice();
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function vector(value,n,label){if(!Array.isArray(value)||value.length!==n||!value.every(Number.isFinite))throw new TypeError(label+' must be a finite '+n+'-element array');return value.slice();}
function quaternion(q){return unit(q,[0,0,0,1]);}
function multiply(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function rotate(v,q){const result=multiply(multiply(q,[...v,0]),[-q[0],-q[1],-q[2],q[3]]);return result.slice(0,3);}
function slerp(a,b,t){let cosine=dot(a,b);if(cosine<0){b=scale(b,-1);cosine=-cosine;}if(cosine>.9995)return quaternion(a.map((v,i)=>v+(b[i]-v)*t));const angle=Math.acos(clamp(cosine,-1,1)),denominator=Math.sin(angle);return a.map((v,i)=>(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/denominator);}
function align(a,b){const cosine=dot(a,b);if(cosine<-.999999){const perpendicular=Math.abs(a[0])<.9?[0,-a[2],a[1]]:[-a[1],a[0],0];return [...unit(perpendicular),0];}return quaternion([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],1+cosine]);}
function flightPose(time,run){const age=Math.max(0,time-run.release.time),v=run.release.velocity,position=run.release.position.map((p,i)=>p+v[i]*age-(i===1?G*age*age/2:0)),velocity=[v[0],v[1]-G*age,v[2]],nose=rotate([1,0,0],run.release.quaternion),aim=unit(velocity,nose),following=quaternion(multiply(align(nose,aim),run.release.quaternion));return {position,velocity,quaternion:slerp(run.release.quaternion,following,smooth(age/.2))};}
function hull(pose){const axis=rotate([1,0,0],pose.quaternion);return {axis,a:add(pose.position,scale(axis,AXIS_LO)),b:add(pose.position,scale(axis,AXIS_HI))};}
function lowestPoint(pose){const {a,b}=hull(pose),p=(a[1]<b[1]?a:b).slice();p[1]-=R;return p;}
function bisect(first,last,fn,threshold=0){for(let i=0;i<70;i++){const mid=(first+last)/2;if(fn(mid)<=threshold)last=mid;else first=mid;}return last;}
function entryTime(run){const start=run.release.time,fn=time=>lowestPoint(flightPose(time,run))[1]-run.waterY;if(fn(start)<=0)return start;const height=run.release.position[1]-run.waterY+REAR+R,v=run.release.velocity[1],span=Math.max(.3,(v+Math.sqrt(v*v+2*G*Math.max(0,height)))/G+.25);let before=start;for(let age=.01;age<=span+.01;age+=.01){const time=start+Math.min(age,span);if(fn(time)<=0)return bisect(before,time,fn);if(age<=.21){const minimum=minimumTime(before,time,fn);const gap=fn(minimum);if(gap<=EPS)return bisect(before,minimum,fn,gap<=0?0:EPS);}before=time;}throw new Error('Could not bracket water entry');}
function waterPose(time,run){const age=Math.max(0,time-run.entry.time),u=clamp(age/TRANSITION,0,1),v0=run.initialHorizontalSpeed,v1=run.speedMps,displacement=age<TRANSITION?v0*age+(v1-v0)*TRANSITION*(u*u*u-.5*u*u*u*u):TRANSITION*(v0+v1)/2+v1*(age-TRANSITION),speed=age<TRANSITION?v0+(v1-v0)*smooth(u):v1;
  const y0=run.entry.center[1],y1=run.waterY-run.depthM,initialYSpeed=run.waterInitialVerticalSpeed,h00=2*u*u*u-3*u*u+1,h10=u*u*u-2*u*u+u,h01=-2*u*u*u+3*u*u;
  const y=age<TRANSITION?h00*y0+h10*TRANSITION*initialYSpeed+h01*y1:y1,vy=age<TRANSITION?((6*u*u-6*u)*y0+(3*u*u-4*u+1)*TRANSITION*initialYSpeed+(-6*u*u+6*u)*y1)/TRANSITION:0;
  return {position:[run.entry.center[0]+run.heading[0]*displacement,y,run.entry.center[2]+run.heading[2]*displacement],velocity:[run.heading[0]*speed,vy,run.heading[2]*speed],quaternion:slerp(run.entry.quaternion,run.horizontalQuaternion,smooth(u))};
}
// Exact segment/AABB distance: every interval between slab crossings has a
// quadratic distance, whose minimum is checked analytically. Capsule contact
// uses this narrow phase, not independently expanded AABB corner overlaps.
function closestSegmentBox(a,b,box){const d=subtract(b,a),cuts=[0,1];for(let i=0;i<3;i++)if(Math.abs(d[i])>EPS)for(const boundary of[box.min[i],box.max[i]]){const t=(boundary-a[i])/d[i];if(t>0&&t<1)cuts.push(t);}cuts.sort((x,y)=>x-y);let best={distanceSq:Infinity};
  const evaluate=t=>{const point=add(a,scale(d,t)),onBox=point.map((v,i)=>clamp(v,box.min[i],box.max[i])),distanceSq=dot(subtract(point,onBox),subtract(point,onBox));if(distanceSq<best.distanceSq)best={distanceSq,point,onBox};};
  for(let j=0;j<cuts.length-1;j++){const lo=cuts[j],hi=cuts[j+1],mid=(lo+hi)/2;let aa=0,bb=0;for(let i=0;i<3;i++){const at=a[i]+d[i]*mid,boundary=at<box.min[i]?box.min[i]:at>box.max[i]?box.max[i]:null;if(boundary!==null){aa+=d[i]*d[i];bb+=d[i]*(a[i]-boundary);}}evaluate(lo);evaluate(hi);if(aa>EPS)evaluate(clamp(-bb/aa,lo,hi));}
  return best;
}
function clearance(time,run){const pose=waterPose(time,run),shape=hull(pose),nearest=closestSegmentBox(shape.a,shape.b,run.collisionBox);return Math.sqrt(nearest.distanceSq)-R;}
function minimumTime(lo,hi,fn){for(let i=0;i<65;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(fn(a)<fn(b))hi=b;else lo=a;}return (lo+hi)/2;}
function contactTime(run){const box=run.collisionBox;if(!box||box.min.some((v,i)=>v>box.max[i]))return null;const start=run.entry.time,end=start+TRANSITION,fn=t=>clearance(t,run);if(fn(start)<=EPS)return start;
  // Search the brief curved entry segment continuously inside each swept
  // interval. A distance bound skips intervals that cannot reach the target.
  const verticalBound=3*Math.abs(run.entry.center[1]-(run.waterY-run.depthM))/TRANSITION+Math.abs(run.waterInitialVerticalSpeed),motionBound=Math.max(run.initialHorizontalSpeed,run.speedMps)+verticalBound+REAR*Math.PI*1.5/TRANSITION;let lo=start,g0=fn(start);
  for(let i=1;i<=130;i++){const hi=start+TRANSITION*i/130,g1=fn(hi);if(g1<=EPS)return bisect(lo,hi,fn,EPS);if(Math.min(g0,g1)<=motionBound*(hi-lo)*.6){const minimum=minimumTime(lo,hi,fn);if(fn(minimum)<=EPS)return bisect(lo,minimum,fn,EPS);}lo=hi;g0=g1;}
  // At depth, translation is linear and attitude is fixed. The AABB slabs
  // bound the entire possible sweep; convex narrow-phase minimisation and a
  // root solve find the earliest real contact even after a large time jump.
  const pose=waterPose(end,run),axis=rotate([1,0,0],pose.quaternion),velocity=pose.velocity;let enter=0,exit=Infinity;
  for(let i=0;i<3;i++){const lower=box.min[i]-Math.max(AXIS_LO*axis[i],AXIS_HI*axis[i])-R,upper=box.max[i]-Math.min(AXIS_LO*axis[i],AXIS_HI*axis[i])+R;if(Math.abs(velocity[i])<EPS){if(pose.position[i]<lower-EPS||pose.position[i]>upper+EPS)return null;}else{let a=(lower-pose.position[i])/velocity[i],b=(upper-pose.position[i])/velocity[i];if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);exit=Math.min(exit,b);}}
  if(exit<enter||exit<0||!Number.isFinite(exit))return null;const first=end+Math.max(0,enter),last=end+exit;if(fn(first)<=EPS)return first;const minimum=minimumTime(first,last,fn);if(fn(minimum)>EPS)return null;return bisect(first,minimum,fn,EPS);
}
function targetBox(target,waterY){if(target===null)return null;target=target||{center:[850,-1.5,0],size:[14,9,100]};const center=vector(target.center,3,'target.center'),size=vector(target.size,3,'target.size');if(size.some(v=>v<=0))throw new RangeError('target.size must be positive');const min=center.map((v,i)=>v-size[i]/2),max=center.map((v,i)=>v+size[i]/2);return {center,size,min,max,submergedMax:[max[0],Math.min(waterY,max[1]),max[2]]};}
export function buildTorpedoRun(options={}){const input=options.release||{time:2,position:[180,38.73,0],velocity:[90,0,0],quaternion:[0,0,0,1]},release={type:'release',time:Number(input.time),position:vector(input.position,3,'release.position'),velocity:vector(input.velocity,3,'release.velocity'),quaternion:quaternion(vector(input.quaternion,4,'release.quaternion'))};if(!Number.isFinite(release.time)||release.time<0)throw new RangeError('release.time must be a nonnegative finite time');
  const waterY=Number.isFinite(options.waterY)?options.waterY:0,speedMps=Number.isFinite(options.speedMps)?clamp(options.speedMps,.1,80):24,depthM=Number.isFinite(options.depthM)?clamp(options.depthM,.3,20):2,target=targetBox(options.target,waterY),horizontalSpeed=Math.hypot(release.velocity[0],release.velocity[2]),nose=rotate([1,0,0],release.quaternion),heading=unit([release.velocity[0],0,release.velocity[2]],unit([nose[0],0,nose[2]]));
  const run={prototype:true,spec:TORPEDO_SPEC,release,waterY,speedMps,depthM,target,initialHorizontalSpeed:horizontalSpeed,heading,horizontalQuaternion:quaternion(multiply(align(nose,heading),release.quaternion)),collisionBox:target?{min:target.min.slice(),max:target.submergedMax.slice()}:null};
  const time=entryTime(run),pose=flightPose(time,run),point=lowestPoint(pose);point[1]=waterY;run.entry={type:'entry',time,position:point,center:pose.position,velocity:pose.velocity,quaternion:pose.quaternion,normal:[0,1,0]};
  // Water impact removes most vertical momentum immediately, then the exact
  // Hermite depth curve settles smoothly. This is a visual motion prototype,
  // not a hydrodynamic pressure, arming or historical performance model. The
  // attitude retains its entry pitch while it levels, rather than snapping
  // to the abruptly damped vertical velocity at the water impact.
  const descent=Math.max(0,run.entry.center[1]-(waterY-depthM));run.waterInitialVerticalSpeed=clamp(pose.velocity[1],-2*descent/TRANSITION,0);
  const hit=contactTime(run);run.contact=null;if(hit!==null){const p=waterPose(hit,run),shape=hull(p),nearest=closestSegmentBox(shape.a,shape.b,run.collisionBox),normal=unit(subtract(nearest.point,nearest.onBox),scale(heading,-1));run.contact={type:'contact',time:hit,position:nearest.onBox,center:p.position,velocity:p.velocity,quaternion:p.quaternion,normal};}
  run.duration=(run.contact?.time??run.entry.time+25)+5;run.events=[run.release,run.entry,...(run.contact?[run.contact]:[])];return freeze(run);
}
export function sampleTorpedo(time,run){if(!run?.release||!run?.entry)throw new TypeError('sampleTorpedo requires a built run');time=Number.isFinite(Number(time))?Number(time):0;let phase,pose;if(time<run.release.time){phase='approach';pose={position:add(run.release.position,scale(run.release.velocity,time-run.release.time)),velocity:run.release.velocity.slice(),quaternion:run.release.quaternion.slice()};}else if(time<run.entry.time){phase='falling';pose=flightPose(time,run);}else if(run.contact&&time>=run.contact.time){phase='hit';pose={position:run.contact.center.slice(),velocity:[0,0,0],quaternion:run.contact.quaternion.slice()};}else{phase=time<run.entry.time+TRANSITION?'entry':'running';pose=waterPose(time,run);}
  let distanceToTarget=0;if(run.target){const box=run.collisionBox.min.some((v,i)=>v>run.collisionBox.max[i])?{min:run.target.min,max:run.target.max}:run.collisionBox,shape=hull(pose);distanceToTarget=Math.max(0,Math.sqrt(closestSegmentBox(shape.a,shape.b,box).distanceSq)-R);}if(phase==='hit')distanceToTarget=0;
  const effectTime=phase==='hit'?run.contact.time:time>=run.entry.time?run.entry.time:run.release.time;return freeze({time,phase,position:pose.position,velocity:pose.velocity,quaternion:pose.quaternion,speedMps:length(pose.velocity),visible:time>=run.release.time,effectAge:Math.max(0,time-effectTime),entryAge:Math.max(0,time-run.entry.time),contactAge:run.contact?Math.max(0,time-run.contact.time):null,distanceToTarget});
}
