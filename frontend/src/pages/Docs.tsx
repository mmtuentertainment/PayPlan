import { lazy, Suspense } from "react";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = lazy(() => import("swagger-ui-react"));

export default function Docs() {
  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<div className="text-center py-8">Loading API documentation...</div>}>
        <SwaggerUI url="/openapi.yaml" />
      </Suspense>
    </div>
  );
}