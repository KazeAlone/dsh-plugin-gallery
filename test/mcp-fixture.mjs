if (process.argv.includes("--require-key") && process.env.GALLERY_API_KEY !== "page-local-key") process.exit(1);
import {McpServer} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
const server=new McpServer({name:'gallery-test',version:'1.0.0'});
server.registerTool('ping',{description:'Test ping'},async()=>({content:[{type:'text',text:'pong'}]}));
await server.connect(new StdioServerTransport());
