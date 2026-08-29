extends Node3D


func _ready() -> void:
	var proof_mesh := get_node_or_null("ProofMesh") as MeshInstance3D
	var proof_camera := get_node_or_null("ProofCamera") as Camera3D
	var proof_light := get_node_or_null("ProofLight") as DirectionalLight3D
	if proof_mesh == null or proof_mesh.mesh == null:
		push_error("Godot smoke proof mesh is missing")
		get_tree().quit(1)
		return
	if proof_camera == null or not proof_camera.current:
		push_error("Godot smoke proof camera is not active")
		get_tree().quit(1)
		return
	if proof_light == null or proof_light.light_energy <= 0.0:
		push_error("Godot smoke proof light is invalid")
		get_tree().quit(1)
		return
	print("GODOT_SMOKE_OK")
	get_tree().quit(0)
