import { PluginObj } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';

export default declare(
    (api: any): PluginObj => {
        api.assertVersion(7);
        console.log(api.parse);

        return {
            visitor: {
                FunctionExpression(path) {
                    console.log(path.node.id?.name); 
                }
            }
        }
    });
