// Public game packets travel over HTTPS WebSockets, including on networks blocking WebRTC.
const BASE='wss://rulmufwtytgfmznuduuo.supabase.co/realtime/v1/websocket';
const KEY='sb_publishable_ImcwfTJHChOS_o3gYTOn-Q_mIEB1lhB';
class Events {
  constructor(){this.handlers=new Map();}
  on(event,fn){const list=this.handlers.get(event)??[];list.push(fn);this.handlers.set(event,list);return this;}
  emit(event,...args){for(const fn of this.handlers.get(event)??[])fn(...args);}
}
class Connection extends Events {
  constructor(peer,id,target,metadata){super();Object.assign(this,{owner:peer,id,target,metadata,open:false,closed:false});}
  get dataChannel(){return this.owner.socket;}
  send(data){if(!this.open)throw new Error('Conexão fechada');this.owner.packet({op:'data',id:this.id,to:this.target,data});}
  close(notify=true){if(this.closed)return;if(notify)this.owner.packet({op:'close',id:this.id,to:this.target});this.closed=true;this.open=false;clearInterval(this.retry);this.owner.connections.delete(this.id);this.emit('close');}
}
export class RelayPeer extends Events {
  static relay=true;
  constructor(id,{WebSocketClass=globalThis.WebSocket}={}){
    super();this.id=id??crypto.randomUUID();this.host=Boolean(id);this.WebSocketClass=WebSocketClass;this.connections=new Map();this.ref=0;this.destroyed=false;
    if(this.host)this.subscribe(this.id);else queueMicrotask(()=>{if(!this.destroyed)this.emit('open',this.id);});
  }
  subscribe(room){
    this.topic=`realtime:svf-340-${room}`;this.socket=new this.WebSocketClass(`${BASE}?apikey=${KEY}&vsn=1.0.0`);
    this.socket.addEventListener('open',()=>{
      this.joinRef=String(++this.ref);this.write('phx_join',{config:{broadcast:{ack:false,self:false},presence:{enabled:false},private:false}},this.joinRef);
      this.heartbeat=setInterval(()=>this.write('heartbeat',{},String(++this.ref),'phoenix'),20000);
    });
    this.socket.addEventListener('message',event=>{
      let m;try{m=JSON.parse(event.data);}catch{return;}
      if(m.topic!==this.topic)return;
      if(m.event==='phx_reply'&&m.ref===this.joinRef){
        if(m.payload?.status!=='ok'){this.emit('error',new Error('Não foi possível conectar ao serviço de salas.'));return;}
        this.joined=true;if(this.host)this.emit('open',this.id);else this.requestConnection();
      }else if(m.event==='broadcast'&&m.payload?.event==='packet')this.receive(m.payload.payload);
      else if(m.event==='phx_error'||m.event==='phx_close')this.emit('error',new Error('A conexão com a sala foi interrompida.'));
    });
    this.socket.addEventListener('error',()=>{if(!this.destroyed)this.emit('error',new Error('Não foi possível conectar à sala online.'));});
    this.socket.addEventListener('close',()=>{clearInterval(this.heartbeat);this.joined=false;for(const c of [...this.connections.values()])c.close(false);if(!this.destroyed)this.emit('error',new Error('A conexão com a sala foi interrompida.'));});
  }
  write(event,payload,ref=String(++this.ref),topic=this.topic){if(this.socket?.readyState===1)this.socket.send(JSON.stringify({topic,event,payload,ref,join_ref:topic===this.topic?this.joinRef:null}));}
  packet(data){if(this.joined)this.write('broadcast',{type:'broadcast',event:'packet',payload:{...data,from:this.id}});}
  connect(target,{metadata}){
    const c=new Connection(this,crypto.randomUUID(),target,metadata);this.connections.set(c.id,c);this.outgoing=c;this.subscribe(target);return c;
  }
  requestConnection(){const c=this.outgoing;if(!c||c.closed)return;const request=()=>this.packet({op:'connect',id:c.id,to:c.target,metadata:c.metadata});request();c.retry=setInterval(request,1000);}
  receive(m){
    if(!m||m.to!==this.id||typeof m.from!=='string'||typeof m.id!=='string'||m.from===this.id)return;
    let c=this.connections.get(m.id);
    if(m.op==='connect'&&this.host){
      if(c){if(c.target===m.from&&c.open)this.packet({op:'accept',id:c.id,to:c.target});return;}
      c=new Connection(this,m.id,m.from,m.metadata);this.connections.set(c.id,c);this.emit('connection',c);
      if(c.closed)return;c.open=true;this.packet({op:'accept',id:c.id,to:c.target});c.emit('open');return;
    }
    if(!c||c.target!==m.from||c.closed)return;
    if(m.op==='accept'&&!this.host&&!c.open){clearInterval(c.retry);c.open=true;c.emit('open');}
    else if(m.op==='data'&&c.open)c.emit('data',m.data);
    else if(m.op==='close')c.close(false);
  }
  disconnect(){} // Keep the active game channel alive.
  destroy(){if(this.destroyed)return;this.destroyed=true;for(const c of [...this.connections.values()])c.close();clearInterval(this.heartbeat);this.joined=false;this.socket?.close();}
}
