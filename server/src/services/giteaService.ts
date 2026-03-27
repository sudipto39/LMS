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
  try {
    console.log(`🔧 Gitea API: Creating repo "${name}" at ${giteaConfig.baseUrl}/user/repos`);
    
    const res = await gitea.post("/user/repos", {
      name,
      description: description || "",
      private: true,
      auto_init: true, // Initialize with README
    });

    console.log(`✅ Gitea API: Repo created successfully`, res.data);
    return res.data;
  } catch (error: any) {
    console.error(`❌ Gitea API Error:`, error.response?.data || error.message);
    throw error;
  }
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
