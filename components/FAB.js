'use client';

export default function FAB({ onClick, icon = '＋' }) {
    return (
        <button className="fab" onClick={onClick} aria-label="Create New">
            {icon}
        </button>
    );
}
