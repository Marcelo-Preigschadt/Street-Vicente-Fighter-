// Public static-auth endpoint documented by Open Relay. This is a provider-published
// shared key, not an account secret. Temporary TURN credentials expire in one hour.
// https://www.metered.ca/tools/openrelay/#static-auth
export async function iceConfig(now=Date.now(),cryptoAPI=crypto){
  const username=`${Math.floor(now/1000)+3600}:street-vicente`;
  const encoder=new TextEncoder();
  const key=await cryptoAPI.subtle.importKey('raw',encoder.encode('openrelayprojectsecret'),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const signed=new Uint8Array(await cryptoAPI.subtle.sign('HMAC',key,encoder.encode(username)));
  const credential=btoa(String.fromCharCode(...signed));
  return {iceServers:[
    {urls:['stun:stun.l.google.com:19302','stun:stun.cloudflare.com:3478']},
    {urls:['turn:staticauth.openrelay.metered.ca:80?transport=udp','turn:staticauth.openrelay.metered.ca:443?transport=tcp','turns:staticauth.openrelay.metered.ca:443?transport=tcp'],username,credential},
  ]};
}
