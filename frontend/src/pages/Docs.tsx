import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function Docs() {
  return (
    <div className="container mx-auto p-4">
      <SwaggerUI url="/openapi.yaml" />
    </div>
  );
}