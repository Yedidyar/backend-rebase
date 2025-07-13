import { type FastifyRequest, type FastifyReply } from "fastify";
import axios, { AxiosError } from "axios";
import { config } from "../config.ts";

export const reportHandler = async (
  req: FastifyRequest<{ Params: { page: string } }>,
  res: FastifyReply,
) => {
  try {
    const response = await axios.request({
      baseURL: `http://${config.ANALYTICS_HOST}:${config.ANALYTICS_PORT}/report/${req.params.page}`,
      headers: req.headers,
      method: req.method,
      data: req.body,
    });

    return res.status(response.status).send();
  } catch (error) {
    const axiosError = error as AxiosError;

    return res.status(500).send({
      error: "Internal server error",
      message: axiosError.message,
    });
  }
};
