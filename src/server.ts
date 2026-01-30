import app from "./app";

const port = Number(process.env.PORT) || 33333;

app.listen(port, () => {
  console.log(`🚀 API rodando na porta ${port}`);
});
