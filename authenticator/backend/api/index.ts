export default function handler(req: any, res: any) {
  res.status(200).json({
    name: "Vault X API",
    status: "healthy",
    version: "1.0.0"
  });
}
