function NumberControl({ value, onChange, min = 0, max = 20 }) {
    return (
        <div className="number-control">
            <button
                className="number-control__btn"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label="Kurangi"
            >
                −
            </button>
            <span className="number-control__value">{value}</span>
            <button
                className="number-control__btn"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label="Tambah"
            >
                +
            </button>
        </div>
    );
}

export default NumberControl;
