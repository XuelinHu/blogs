---
title: ollama生成中断
date: 2025-06-26
created: 2025-06-26
updated: 2025-06-26
---

# 1. ollama生成中断

## 1.1. 现象

定时任务在调用ollama后没有响应，日志中断，不再更新，日志内容如下：

```text
2025-06-26 04:33:58,681 PID:3239086 TID:137854543988288 INFO crawl_news.py:40  bbc0 爬取完成。
2025-06-26 04:33:58,682 PID:3239086 TID:137854804579392 INFO crawl_news.py:737  并发爬取新闻耗时: 237.07 秒
2025-06-26 04:33:58,682 PID:3239086 TID:137854804579392 INFO crawl_news.py:739  开始AI生成摘要
2025-06-26 04:33:58,682 PID:3239086 TID:137854804579392 INFO crawl_news.py:675  开始处理 bbc0 的新闻结果文件...
2025-06-26 04:34:15,597 PID:3239086 TID:137854804579392 INFO ollama_client.py:14   Ollama函数 translate_to_chinese 耗时 16.9146 秒
2025-06-26 04:34:15,597 PID:3239086 TID:137854804579392 INFO ollama_client.py:125  当前文本过长，当前长度=8901,截取到4914
```

可以看出`04:34:15`就没有日志打印了，通过ps查看到shell和python两个进程一直都存在。

使用命令查看 `journalctl -u ollama --no-pager | grep "26 04:34"`

```text

deipss@deipss-All-Series:/****news$ journalctl -u ollama --no-pager | grep "26 04:34"
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: special_eos_id is not in special_eog_ids - the tokenizer config may be incorrect
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: special tokens cache size = 256
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: token to piece cache size = 0.7999 MB
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: arch             = llama
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: vocab_only       = 1
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: model type       = ?B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: model params     = 8.03 B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: general.name     = DeepSeek R1 Distill Llama 8B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: vocab type       = BPE
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_vocab          = 128256
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_merges         = 280147
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: BOS token        = 128000 '<｜begin▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOS token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOT token        = 128009 '<|eot_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOM token        = 128008 '<|eom_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: PAD token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: LF token         = 198 'Ċ'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128008 '<|eom_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128009 '<|eot_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: max token length = 256
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_load: vocab only - skipping tensors
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.284+08:00 level=INFO source=server.go:405 msg="starting llama server" cmd="/usr/bin/ollama runner --model /usr/share/ollama/.ollama/models/blobs/sha256-6340dc3229b0d08ea9cc49b75d4098702983e17b4c096d57afbbf2ffc813f2be --ctx-size 8192 --batch-size 512 --n-gpu-layers 33 --threads 4 --parallel 4 --port 46521"
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.284+08:00 level=INFO source=sched.go:450 msg="loaded runners" count=1
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.284+08:00 level=INFO source=server.go:580 msg="waiting for llama runner to start responding"
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.284+08:00 level=INFO source=server.go:614 msg="waiting for server to become available" status="llm server error"
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.327+08:00 level=INFO source=runner.go:846 msg="starting go runner"
6月 26 04:34:00 deipss-All-Series ollama[1073]: ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
6月 26 04:34:00 deipss-All-Series ollama[1073]: ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
6月 26 04:34:00 deipss-All-Series ollama[1073]: ggml_cuda_init: found 1 CUDA devices:
6月 26 04:34:00 deipss-All-Series ollama[1073]:   Device 0: NVIDIA GeForce GTX 1080, compute capability 6.1, VMM: yes
6月 26 04:34:00 deipss-All-Series ollama[1073]: load_backend: loaded CUDA backend from /usr/lib/ollama/cuda_v12/libggml-cuda.so
6月 26 04:34:00 deipss-All-Series ollama[1073]: load_backend: loaded CPU backend from /usr/lib/ollama/libggml-cpu-haswell.so
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.570+08:00 level=INFO source=ggml.go:109 msg=system CPU.0.SSE3=1 CPU.0.SSSE3=1 CPU.0.AVX=1 CPU.0.AVX2=1 CPU.0.F16C=1 CPU.0.FMA=1 CPU.0.LLAMAFILE=1 CPU.1.LLAMAFILE=1 CUDA.0.ARCHS=500,600,610,700,750,800,860,870,890,900,1200 CUDA.0.USE_GRAPHS=1 CUDA.0.PEER_MAX_BATCH_SIZE=128 compiler=cgo(gcc)
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.573+08:00 level=INFO source=runner.go:906 msg="Server listening on 127.0.0.1:46521"
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_load_from_file_impl: using device CUDA0 (NVIDIA GeForce GTX 1080) - 7990 MiB free
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: loaded meta data with 28 key-value pairs and 292 tensors from /usr/share/ollama/.ollama/models/blobs/sha256-6340dc3229b0d08ea9cc49b75d4098702983e17b4c096d57afbbf2ffc813f2be (version GGUF V3 (latest))
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   0:                       general.architecture str              = llama
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   1:                               general.type str              = model
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   2:                               general.name str              = DeepSeek R1 Distill Llama 8B
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   3:                           general.basename str              = DeepSeek-R1-Distill-Llama
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   4:                         general.size_label str              = 8B
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   5:                          llama.block_count u32              = 32
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   6:                       llama.context_length u32              = 131072
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   7:                     llama.embedding_length u32              = 4096
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   8:                  llama.feed_forward_length u32              = 14336
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv   9:                 llama.attention.head_count u32              = 32
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  10:              llama.attention.head_count_kv u32              = 8
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  11:                       llama.rope.freq_base f32              = 500000.000000
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  12:     llama.attention.layer_norm_rms_epsilon f32              = 0.000010
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  13:                          general.file_type u32              = 15
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  14:                           llama.vocab_size u32              = 128256
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  15:                 llama.rope.dimension_count u32              = 128
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  16:                       tokenizer.ggml.model str              = gpt2
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  17:                         tokenizer.ggml.pre str              = llama-bpe
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  18:                      tokenizer.ggml.tokens arr[str,128256]  = ["!", "\"", "#", "$", "%", "&", "'", ...
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  19:                  tokenizer.ggml.token_type arr[i32,128256]  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  20:                      tokenizer.ggml.merges arr[str,280147]  = ["Ġ Ġ", "Ġ ĠĠĠ", "ĠĠ ĠĠ", "...
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  21:                tokenizer.ggml.bos_token_id u32              = 128000
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  22:                tokenizer.ggml.eos_token_id u32              = 128001
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  23:            tokenizer.ggml.padding_token_id u32              = 128001
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  24:               tokenizer.ggml.add_bos_token bool             = true
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  25:               tokenizer.ggml.add_eos_token bool             = false
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - kv  27:               general.quantization_version u32              = 2
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - type  f32:   66 tensors
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - type q4_K:  193 tensors
6月 26 04:34:00 deipss-All-Series ollama[1073]: llama_model_loader: - type q6_K:   33 tensors
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: file format = GGUF V3 (latest)
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: file type   = Q4_K - Medium
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: file size   = 4.58 GiB (4.89 BPW)
6月 26 04:34:00 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:00.786+08:00 level=INFO source=server.go:614 msg="waiting for server to become available" status="llm server loading model"
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: special_eos_id is not in special_eog_ids - the tokenizer config may be incorrect
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: special tokens cache size = 256
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: token to piece cache size = 0.7999 MB
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: arch             = llama
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: vocab_only       = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_ctx_train      = 131072
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_embd           = 4096
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_layer          = 32
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_head           = 32
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_head_kv        = 8
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_rot            = 128
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_swa            = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_embd_head_k    = 128
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_embd_head_v    = 128
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_gqa            = 4
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_embd_k_gqa     = 1024
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_embd_v_gqa     = 1024
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: f_norm_eps       = 0.0e+00
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: f_norm_rms_eps   = 1.0e-05
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: f_clamp_kqv      = 0.0e+00
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: f_max_alibi_bias = 0.0e+00
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: f_logit_scale    = 0.0e+00
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_ff             = 14336
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_expert         = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_expert_used    = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: causal attn      = 1
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: pooling type     = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: rope type        = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: rope scaling     = linear
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: freq_base_train  = 500000.0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: freq_scale_train = 1
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_ctx_orig_yarn  = 131072
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: rope_finetuned   = unknown
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: ssm_d_conv       = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: ssm_d_inner      = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: ssm_d_state      = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: ssm_dt_rank      = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: ssm_dt_b_c_rms   = 0
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: model type       = 8B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: model params     = 8.03 B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: general.name     = DeepSeek R1 Distill Llama 8B
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: vocab type       = BPE
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_vocab          = 128256
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: n_merges         = 280147
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: BOS token        = 128000 '<｜begin▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOS token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOT token        = 128009 '<|eot_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOM token        = 128008 '<|eom_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: PAD token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: LF token         = 198 'Ċ'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128001 '<｜end▁of▁sentence｜>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128008 '<|eom_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: EOG token        = 128009 '<|eot_id|>'
6月 26 04:34:00 deipss-All-Series ollama[1073]: print_info: max token length = 256
6月 26 04:34:00 deipss-All-Series ollama[1073]: load_tensors: loading model tensors, this can take a while... (mmap = true)
6月 26 04:34:13 deipss-All-Series ollama[1073]: load_tensors: offloading 32 repeating layers to GPU
6月 26 04:34:13 deipss-All-Series ollama[1073]: load_tensors: offloading output layer to GPU
6月 26 04:34:13 deipss-All-Series ollama[1073]: load_tensors: offloaded 33/33 layers to GPU
6月 26 04:34:13 deipss-All-Series ollama[1073]: load_tensors:        CUDA0 model buffer size =  4403.49 MiB
6月 26 04:34:13 deipss-All-Series ollama[1073]: load_tensors:   CPU_Mapped model buffer size =   281.81 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_seq_max     = 4
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_ctx         = 8192
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_ctx_per_seq = 2048
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_batch       = 2048
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_ubatch      = 512
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: flash_attn    = 0
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: freq_base     = 500000.0
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: freq_scale    = 1
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: n_ctx_per_seq (2048) < n_ctx_train (131072) -- the full capacity of the model will not be utilized
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_kv_cache_init: kv_size = 8192, offload = 1, type_k = 'f16', type_v = 'f16', n_layer = 32, can_shift = 1
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_kv_cache_init:      CUDA0 KV buffer size =  1024.00 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: KV self size  = 1024.00 MiB, K (f16):  512.00 MiB, V (f16):  512.00 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model:  CUDA_Host  output buffer size =     2.02 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model:      CUDA0 compute buffer size =   560.00 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model:  CUDA_Host compute buffer size =    24.01 MiB
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: graph nodes  = 1030
6月 26 04:34:14 deipss-All-Series ollama[1073]: llama_init_from_model: graph splits = 2
6月 26 04:34:14 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:14.334+08:00 level=INFO source=server.go:619 msg="llama runner started in 14.05 seconds"
6月 26 04:34:15 deipss-All-Series ollama[1073]: [GIN] 2025/06/26 - 04:34:15 | 200 | 16.834316066s |       127.0.0.1 | POST     "/api/generate"
6月 26 04:34:15 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:15.689+08:00 level=WARN source=types.go:522 msg="invalid option provided" option=max_tokens
6月 26 04:34:40 deipss-All-Series ollama[1073]: [GIN] 2025/06/26 - 04:34:40 | 200 | 24.368459021s |       127.0.0.1 | POST     "/api/generate"
```

从上面的日志中，截取以下部分

```text
6月 26 04:34:00 deipss-All-Series ollama[1073]: load: special_eos_id is not in special_eog_ids - the tokenizer config may be incorrect
6月 26 04:34:15 deipss-All-Series ollama[1073]: time=2025-06-26T04:34:15.689+08:00 level=WARN source=types.go:522 msg="invalid option provided" option=max_tokens
```

可以看出：有疑点的地方，只有上面两条纪录。第一条与本次问题无关，第二条其实也无关。

以下的是AI的回答

### 1.1.1. Ollama "invalid option provided" 错误解析

你遇到的这个警告是Ollama在启动或运行时检测到不支持的参数导致的。具体来说：

- **错误位置**：`source=types.go:522` 表示错误发生在Ollama源码的 `types.go` 文件第522行
- **错误信息**：`invalid option provided` 指出你传递了一个无效的选项
- **具体选项**：`option=max_tokens` 明确是 `max_tokens` 参数不被识别

### 1.1.2. 可能的原因及解决方案

#### 1. 参数名称拼写错误

- **问题**：Ollama可能使用了不同的参数名称（如 `max_new_tokens` 而非 `max_tokens`）
- **解决**：检查Ollama文档确认正确的参数名称
    - 例如，某些模型可能使用 `max_new_tokens` 控制生成长度

#### 2. 版本兼容性问题

- **问题**：你使用的Ollama版本可能不支持 `max_tokens` 参数
- **解决**：
    - 升级Ollama到最新版本：`ollama upgrade`
    - 查看对应版本的文档确认参数支持情况

#### 3. 参数传递方式错误

- **问题**：参数可能被错误地传递给了不支持它的API或命令
- **解决**：
    - 如果是通过API调用，检查请求格式是否正确
    - 如果是命令行调用，确认参数位置是否正确

#### 4. 模型特定限制

- **问题**：某些模型可能有自己的参数命名规则或限制
- **解决**：
    - 检查具体模型的文档（例如llama2、mistral等模型可能有不同的参数要求）
    - 尝试使用模型支持的参数（如 `temperature`、`top_p` 等）

### 1.1.3. 示例：正确设置生成长度参数

如果你的目标是控制生成文本的长度，可以尝试以下方法：

```bash
# 使用 max_new_tokens 参数（如果支持）
ollama run llama2 --max_new_tokens 200

# 或者通过环境变量设置（如果适用）
OLLAMA_MAX_TOKENS=200 ollama run llama2
```

实际上，应该使用以下的参数，上面是使用豆包写的，比不上Chat-GPT

| 目标功能                   | OpenAI 参数    | HuggingFace 参数   | Ollama 参数     |
|------------------------|--------------|------------------|---------------|
| 限制生成的新 token 数量        | `max_tokens` | `max_new_tokens` | `num_predict` |
| 限制总 token（prompt + 生成） | 不直接支持        | `max_length`     | ❌不支持          |



## 1.2. 总结
没有找到根本原因是什么，直接kill -9 相关的进程。


| 功能                | 命令                                       |
| ----------------- | ---------------------------------------- |
| 查看全部日志            | `journalctl`                             |
| 按时间排序（最新在下）       | `journalctl --reverse` 或 `journalctl -r` |
| 只看今天的日志           | `journalctl --since today`               |
| 从某时间开始看日志         | `journalctl --since "2025-06-26 08:00"`  |
| 实时查看（像 `tail -f`） | `journalctl -f`                          |
| 查看某个服务的日志         | `journalctl -u nginx.service`            |
| 查看系统启动相关日志        | `journalctl -b`                          |
| 查看上一次启动的日志        | `journalctl -b -1`                       |
| 只看错误日志            | `journalctl -p err` 或 `journalctl -p 3`  |
