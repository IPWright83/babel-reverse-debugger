/**
 * Recurses through an object to obtain suitable display values
 * so we can print a complex object to screen later on
 * @param  {babel.types}                        t                                 
 * @param  {ObjectExpression}                   objExpression
 * @return {ObjectExpression|ObjectProperty}
 */
function getObjectExpression(t, objExpression) {
    const properties = objExpression.properties.map(prop => {
        if (prop.value.type === "ObjectExpression") {
            // If the property value is an object expression, recursively handle it
            return t.objectProperty(prop.key, getObjectExpression(t, prop.value));
        } else {
            return t.objectProperty(prop.key, getDisplayValue(t, prop.value));
        }
    });

    return t.objectExpression(properties);
}

function getDisplayValue(t, expression) {
    if (!expression) {
        return t.identifier("undefined");
    }

    switch (expression.type) {
        case "NumericLiteral":
            return t.numericLiteral(expression.value);
        case "StringLiteral":
            return t.stringLiteral(expression.value);
        case "BooleanLiteral":
            return t.booleanLiteral(expression.value);
        case "ObjectExpression":
            return getObjectExpression(t, expression);
        default: {
            return t.stringLiteral("λ");
        }
    }
}

module.exports = getDisplayValue;
