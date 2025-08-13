import { useState } from "react";
import './App.css';

export default function FileUpload({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length) {
            setSelectedFile(files[0]);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile || !description.trim()) {
            alert('Please select a file and provide a description');
            return;
        }

        setLoading(true)
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('description', description);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            onUploadComplete(data);
        } catch (err) {
            console.error(err);
            alert('Upload failed')
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h2>PDF Data Extraction</h2>
                <p>Upload your PDF and describe what you want to extract</p>
            </div>

            <div className="upload-content">
                {/* File Upload Box - handles drag & drop and file selection */}
                <div className="upload-box file-upload-box">
                {/* Box header with icon and title */}
                <div className="box-header">
                    <div className="box-icon">📄</div>
                    <h3>Upload PDF File</h3>
                </div>
                
                {/* Drag and drop area with visual feedback */}
                <div
                    className={`upload-area ${isDragging ? 'dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Upload icon and text */}
                    <div className="upload-icon">⬆️</div>
                    <div className="upload-text">
                    <p className="upload-title">Drop your PDF here</p>
                    <p className="upload-subtitle">or click to browse files</p>
                    </div>
                    {/* Hidden file input wrapped in styled label */}
                    <label className="upload-button">
                    Choose File
                    <input type="file" accept=".pdf" onChange={handleFileChange} hidden />
                    </label>
                </div>
                
                {/* File info display when a file is selected */}
                {selectedFile && (
                    <div className="file-info">
                    <div className="file-icon">✅</div>
                    <div className="file-details">
                        <p className="file-name">{selectedFile.name}</p>
                        <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    </div>
                )}
                </div>

                {/* Description Box - for user to specify extraction instructions */}
                <div className="upload-box description-box">
                {/* Box header with icon and title */}
                <div className="box-header">
                    <div className="box-icon">🎯</div>
                    <h3>Extraction Instructions</h3>
                </div>
                
                {/* Description input area */}
                <div className="description-content">
                    <label htmlFor="description">Describe the structure and type of data you want to extract:</label>
                    <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Extract contact information including name, email, phone number, and address from this resume..."
                    rows={4}
                    />
                    {/* Helpful tip for users */}
                    <div className="description-tips">
                    <p>💡 <strong>Tip:</strong> Be specific about what fields you want to extract</p>
                    </div>
                </div>
                </div>
            </div>

            {selectedFile && description.trim() && (
                <div className="submit-section">
                    <button
                        className="extract-button"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Extracting Data...
                            </>
                        ) : (

                            <>
                             <span className="button-icon">🔍</span>
                             Extract Data
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}