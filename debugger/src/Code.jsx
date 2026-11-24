import { useRef, useEffect, useState, useLayoutEffect } from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Selection } from "./Selection";

export const Code = ({ code, selection }) => {
    const container = useRef();
    const [codeShown, setCode] = useState("M");
    const [bounds, setBounds] = useState(undefined);

    useLayoutEffect(() => {
        if (!container.current) return;

        // Grab the rendered M and measure it
        const current = container.current;
        const span = current.getElementsByTagName("span")[1];
        const bounds = span.getBoundingClientRect();

        // Set the bounds then display the actual code
        setBounds(bounds)
    }, [container.current])

    useEffect(() => {
        if (bounds) setCode(code);
    }, [bounds, code])

    return (
        <div ref={container}>
            {!!selection && (<Selection row={selection.lineNumber} column={1} columnCount={30} bounds={bounds} />)}
            <SyntaxHighlighter language="javascript" style={a11yDark} showLineNumbers >
                {codeShown}
            </SyntaxHighlighter>
        </div>
    );
}
