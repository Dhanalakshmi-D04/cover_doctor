import UploadForm from "../components/UploadForm";
import CreateBookProjectForm from "../components/CreateBookProjectForm";

export default function Home({ onUploaded }) {
  return (
    <div className="home-page">
      <h1>Cover Doctor</h1>
      <p>Upload your book cover to see how it measures up.</p>
      <CreateBookProjectForm />
      <UploadForm onUploaded={onUploaded} />
    </div>
  );
}
