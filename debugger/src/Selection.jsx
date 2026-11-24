export const Selection = ({ row, column, columnCount = 1, bounds }) => {
    // Unable to render if we haven't measured bounds yet
    if (!bounds) {
        return;
    }

    const rowIndex = row - 1;
    const columnIndex = column - 1;

    // This represents the padding around the 
    const left = bounds.x + (columnIndex * bounds.width);
    const top = bounds.top + (rowIndex * bounds.height);
    const height = bounds.height;
    const width = columnCount * bounds.width;

    // const left = offset 



    const style = {
        border: "thin solid #CCC",
        background: "#CCC",
        opacity: 0.25,
        left,
        top,
        height,
        width,
        position: "absolute",
    }

    return <div style={style} />
}
