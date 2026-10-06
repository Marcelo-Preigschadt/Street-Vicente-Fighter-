const URL='https://rulmufwtytgfmznuduuo.supabase.co/rest/v1/svf_rooms';
const KEY='sb_publishable_ImcwfTJHChOS_o3gYTOn-Q_mIEB1lhB';
const FIELDS='code,status,character,created_at,expires_at';
export const roomLabel=status=>status==='waiting'?'Aguardando jogador':'Jogando';
export class RoomDirectory {
  constructor({fetcher=(...args)=>globalThis.fetch(...args),onChange=()=>{},onError=()=>{}}={}){
    Object.assign(this,{fetcher,onChange,onError});this.queue=Promise.resolve();this.rooms=[];this.closed=false;
  }
  async request(query='',{method='GET',body,token,keepalive=false}={}){
    const headers={apikey:KEY};if(token)headers['x-room-token']=token;
    if(body){headers['Content-Type']='application/json';headers.Prefer='return=minimal';}
    const response=await this.fetcher(URL+query,{method,headers,body:body?JSON.stringify(body):undefined,keepalive,signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Lista de salas indisponível. Tente atualizar.');
    return response.status===204||method!=='GET'?null:response.json();
  }
  async refresh(){
    if(this.refreshing)return;this.refreshing=true;
    try{this.rooms=await this.request(`?select=${FIELDS}&order=created_at.desc&limit=100`);this.onChange(this.rooms);}
    catch(error){this.onError(error.message);}finally{this.refreshing=false;}
  }
  enqueue(action){const result=this.queue.then(action);this.queue=result.catch(error=>this.onError(error.message));return result;}
  register(code,character){
    const owner={code,character,status:'waiting',token:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')};
    this.owner=owner;
    return this.enqueue(async()=>{
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner.token));
      const owner_hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
      await this.request('',{method:'POST',token:owner.token,body:{code,character,status:owner.status,owner_hash}});
      await this.refresh();
    });
  }
  update(status,character){
    const owner=this.owner;if(!owner)return Promise.resolve();owner.status=status;owner.character=character;
    return this.enqueue(async()=>{await this.request(`?code=eq.${owner.code}`,{method:'PATCH',token:owner.token,body:{status,character}});await this.refresh();});
  }
  remove({keepalive=false}={}){
    const owner=this.owner;this.owner=null;if(!owner)return Promise.resolve();
    return this.enqueue(async()=>{await this.request(`?code=eq.${owner.code}`,{method:'DELETE',token:owner.token,keepalive});if(!keepalive)await this.refresh();});
  }
  start(){
    this.refresh();this.poll=setInterval(()=>{if(!globalThis.document?.hidden)this.refresh();},5000);
    this.heartbeat=setInterval(()=>{if(this.owner)this.update(this.owner.status,this.owner.character).catch(()=>{});},20000);
  }
  stop(){clearInterval(this.poll);clearInterval(this.heartbeat);return this.remove({keepalive:true});}
}
