import { useEffect, useState } from "react";
import { auth } from "../../../services/firebase";
import { getCertificate } from "../../../services/certificatesApi";
import { getProject } from "../../../services/projectsApi";

export const useCertificateData = ({
  id,
  isProjectRoute,
  navigate,
  onProjectLoaded,
}) => {
  const [certificate, setCertificate] = useState(null);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = auth.currentUser;
        const token = await currentUser?.getIdToken();

        if (!token) {
          navigate("/login");
          return;
        }

        if (isProjectRoute) {
          const data = await getProject(id, token);

          setProjectId(data.id);
          setCertificate({
            id: data.certificate_id,
            name: data.title,
            previewUrl: data.image_path,
          });

          onProjectLoaded(data);
        } else {
          const data = await getCertificate(id, token);

          setCertificate({
            ...data,
            name: data.title,
            previewUrl: data.image_path,
          });
        }
      } catch (error) {
        console.error(error);
        navigate("/");
      }
    };

    if (id) loadData();
  }, [id, navigate, isProjectRoute, onProjectLoaded]);

  return {
    certificate,
    projectId,
    setProjectId,
  };
};
