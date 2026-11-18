const{openSession}=require('../services/jwt.service');const{AppError}=require('./error-handler');const COOKIE_NAME='cursoia_session';
function readToken(req){const p=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+'='));return p?decodeURIComponent(p.slice(COOKIE_NAME.length+1)):null;}
async function resolveUser(req){const t=readToken(req);if(!t)return null;const s=await openSession(t);if(s){req.authToken=t;req.user=s.user;req.session=s.session;}return s;}
async function requireAuth(req,res,next){try{if(!await resolveUser(req))throw new AppError(401,'Inicia sesión para continuar.','AUTH_REQUIRED');next();}catch(e){next(e);}}
function requireRole(...roles){return(req,res,next)=>!req.user||!roles.includes(req.user.Rol)?next(new AppError(403,'No tienes permisos para acceder a esta sección.','FORBIDDEN')):next();}
function requireSelfOrAdmin(param='id'){return(req,res,next)=>{if(req.user?.Rol==='Administrador'||String(req.params[param])===String(req.user?.id_cliente))return next();return next(new AppError(404,'Registro no encontrado.','NOT_FOUND'));};}
module.exports={COOKIE_NAME,readToken,resolveUser,requireAuth,requireRole,requireSelfOrAdmin};
