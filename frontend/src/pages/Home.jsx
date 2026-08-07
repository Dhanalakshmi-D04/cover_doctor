import UploadForm from "../components/UploadForm";

export default function Home({ onUploaded }) {
  return (
    <div className="home-page">
      <h1>Cover Doctor</h1>
      <p>Upload your book cover to see how it measures up.</p>
      <UploadForm onUploaded={onUploaded} />
    </div>
  );
}
