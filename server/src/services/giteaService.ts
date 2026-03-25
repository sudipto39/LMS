import axios from "axios";
import { giteaConfig } from "../config/gitea.js";

const gitea = axios.create({
  baseURL: giteaConfig.baseUrl,
  headers: {
    Authorization: `token ${giteaConfig.token}`,
  },
});

export default gitea;

export const createRepo = async (name: string, description?: string) => {
  const res = await gitea.post("/user/repos", {
    name,
    description: description || "",
    private: true,
    auto_init: true, // Initialize with README
  });

  return res.data;
};

export const getRepo = async (owner: string, repo: string) => {
  const res = await gitea.get(`/repos/${owner}/${repo}`);
  return res.data;
};

export const getRepoCommits = async (owner: string, repo: string) => {
  const res = await gitea.get(`/repos/${owner}/${repo}/commits`);
  return res.data;
};

export const getBranches = async (owner: string, repo: string) => {
  const res = await gitea.get(`/repos/${owner}/${repo}/branches`);
  return res.data;
};
