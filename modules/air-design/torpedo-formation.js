// Deterministic three-aircraft attack choreography. Metres and seconds.
// The aircraft keep parallel headings; each torpedo inherits its real mount's
// release pose and velocity and then runs straight without homing.
import {buildTorpedoRun, sampleTorpedo, TORPEDO_SPEC} from './torpedo-motion.js';

const SPEED=90, ALTITUDE=40, CLIMB=32, CLIMB_SECONDS=7;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finiteTime=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function vector(value,label){if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw new TypeError(label+' must be a finite 3-element array');return value.slice();}
function rotatePitch(v,pitch){const c=Math.cos(pitch),s=Math.sin(pitch);return [c*v[0]-s*v[1],s*v[0]+c*v[1],v[2]];}

export function sampleAttackAircraft(time,index,attack){
  time=finiteTime(time);
  const member=attack?.members?.[index];
  if(!member)throw new RangeError('Aircraft index is outside this attack');
  const u=clamp((time-member.releaseTime-1)/CLIMB_SECONDS,0,1),smooth=u*u*(3-2*u);
  const verticalSpeed=u>0&&u<1?CLIMB*6*u*(1-u)/CLIMB_SECONDS:0;
  const position=[SPEED*time+member.offset[0],ALTITUDE+CLIMB*smooth,member.offset[2]],velocity=[SPEED,verticalSpeed,0];
  const pitchRad=Math.atan2(verticalSpeed,SPEED),quaternion=[0,0,Math.sin(pitchRad/2),Math.cos(pitchRad/2)];
  return {time,index,position,velocity,quaternion,pitchRad,yawRad:0,rollRad:0,speedMps:Math.hypot(...velocity),altitudeM:position[1],turnRateRad:0,yawRateRad:0};
}

function mountPose(time,index,attack){
  const aircraft=sampleAttackAircraft(time,index,attack),local=rotatePitch(attack.hardpointLocal,aircraft.pitchRad);
  return {position:local.map((v,i)=>v+aircraft.position[i]),quaternion:aircraft.quaternion};
}

export function buildTorpedoAttack(options={}){
  const formation=options.formation==='solo'?'solo':'vee';
  const hardpointLocal=vector(options.hardpointLocal??[0,-1.27,0],'hardpointLocal');
  const count=formation==='vee'?3:1;
  const members=Array.from({length:count},(_,index)=>({index,label:String(index+1),releaseTime:2+index*.65,offset:index===0?[0,0,0]:[-26,0,index===1?-26:26]}));
  const attack={formation,hardpointLocal,members};
  members.forEach(member=>{
    const time=member.releaseTime,pose=mountPose(time,member.index,attack),before=mountPose(time-.001,member.index,attack),after=mountPose(time+.001,member.index,attack);
    member.run=buildTorpedoRun({release:{time,...pose,velocity:after.position.map((v,i)=>(v-before.position[i])/.002)},waterY:0,speedMps:24,depthM:2,...('target' in options?{target:options.target}:{})});
  });
  const releases=members.map(member=>member.run.release.time),entries=members.map(member=>member.run.entry.time),hits=members.map(member=>member.run.contact?.time).filter(Number.isFinite);
  attack.target=members[0].run.target;
  attack.duration=Math.max(...members.map(member=>member.run.duration));
  attack.phaseTimes={release:Math.min(...releases),entry:Math.min(...entries),running:Math.min(...entries)+TORPEDO_SPEC.transitionSeconds,hit:hits.length?Math.min(...hits):null,lastHit:hits.length?Math.max(...hits):null};
  return freeze(attack);
}

export function sampleAttack(time,attack){
  time=finiteTime(time);
  if(!attack?.members?.length)throw new TypeError('sampleAttack requires a built attack');
  const members=attack.members.map(member=>({index:member.index,label:member.label,releaseTime:member.releaseTime,run:member.run,aircraft:sampleAttackAircraft(time,member.index,attack),torpedo:sampleTorpedo(time,member.run)}));
  const counts={approach:0,falling:0,entry:0,running:0,hit:0};
  members.forEach(member=>counts[member.torpedo.phase]++);
  const phase=counts.hit?'hit':counts.running?'running':counts.entry?'entry':counts.falling?'falling':'approach';
  return freeze({time,formation:attack.formation,phase,members,counts,allHit:counts.hit===members.length});
}
