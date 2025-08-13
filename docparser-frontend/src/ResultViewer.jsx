import ReactMarkdown from 'react-markdown'
import './App.css'

export default function ResultViewer({ result }) {
    const { markdown, data_points } = result;

    const handleSaveCSV = () => {
        const csvContent = [
            ['Field', 'Value'],
            ...data_points.map(item => [item.field, item.value])
        ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'extracted_data_points.csv');
        link.style.visibility = 'hidden'
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="result-sections">
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">Extracted Data Points</h2>
                    <button className="save-csv-button" onClick={handleSaveCSV}>
                        <span className="button-icon">📊</span>
                        Save as CSV
                    </button>
                </div>
                <div className="table-container">
                    <table className="result-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data_points.map((item, index) => (
                                <tr key={index}>
                                    <td className="field-cell">{item.field}</td>
                                    <td className="value-cell">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <h2 className="section-title">Document View</h2>
                <div className="markdown-content">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}